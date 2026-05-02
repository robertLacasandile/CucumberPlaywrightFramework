const logger = require('../logging/framework-logger').getLogger('SmartLocators');

const minimumHealingScore = 45;

class SmartLocatorEngine {
  constructor(page) {
    this.page = page;
  }

  async resolve(action, referenceText) {
    const text = String(referenceText);
    const candidates = this.strategyCandidates(action, text);
    const matched = await this.firstMatchingCandidate(candidates);

    if (matched) {
      logger.phase(
        'SMART-LOCATOR',
        '{} "{}" -> {} score={} reason={}',
        action,
        text,
        matched.strategy,
        matched.score,
        matched.reason
      );
      return matched;
    }

    return this.healFromDom(action, text);
  }

  strategyCandidates(action, text) {
    const escapedText = cssString(text);
    const name = this.nameLike(text);
    const id = this.idLike(text);
    const escapedAttribute = attributeString(text);

    const strategies = {
      click: [
        candidate(this.page.getByRole('button', { name: text, exact: true }), 'role:button exact name', 100, 'Exact accessible button name'),
        candidate(this.page.getByRole('link', { name: text, exact: true }), 'role:link exact name', 98, 'Exact accessible link name'),
        candidate(this.page.locator(`input[value="${escapedAttribute}"]`), 'input exact value', 94, 'Exact input value'),
        candidate(this.page.locator(`button:has-text(${escapedText})`), 'button text', 90, 'Button contains visible text'),
        candidate(this.page.locator(`a:has-text(${escapedText})`), 'link text', 88, 'Link contains visible text'),
        candidate(this.page.getByText(text, { exact: true }), 'visible text exact', 70, 'Exact visible text fallback')
      ],
      type: [
        candidate(this.page.getByLabel(text, { exact: true }), 'label exact', 100, 'Exact form label'),
        candidate(this.page.getByPlaceholder(text, { exact: true }), 'placeholder exact', 95, 'Exact placeholder'),
        candidate(this.page.locator(`input[name="${name}"], textarea[name="${name}"]`), 'name normalized', 88, 'Normalized name attribute'),
        candidate(this.page.locator(`input[id="${id}"], textarea[id="${id}"]`), 'id normalized', 86, 'Normalized id attribute')
      ],
      select: [
        candidate(this.page.getByLabel(text, { exact: true }), 'select label exact', 100, 'Exact select label'),
        candidate(this.page.locator(`select[name="${name}"]`), 'select name normalized', 88, 'Normalized select name'),
        candidate(this.page.locator(`select[id="${id}"]`), 'select id normalized', 86, 'Normalized select id')
      ],
      check: [
        candidate(this.page.getByLabel(text, { exact: true }), 'check label exact', 100, 'Exact checkbox or radio label'),
        candidate(this.page.locator(`input[type="checkbox"][value="${escapedAttribute}"], input[type="radio"][value="${escapedAttribute}"]`), 'check value exact', 88, 'Exact checkbox or radio value')
      ]
    };

    return strategies[action] || [
      candidate(this.page.getByText(text, { exact: true }), 'visible text exact', 70, 'Exact visible text fallback')
    ];
  }

  async firstMatchingCandidate(candidates) {
    for (const item of candidates) {
      const count = await item.locator.count().catch(() => 0);

      for (let index = 0; index < count; index += 1) {
        const locator = item.locator.nth(index);
        if (await locator.isVisible().catch(() => false)) {
          return {
            ...item,
            locator,
            healed: false,
            recommendations: []
          };
        }
      }
    }

    return null;
  }

  async healFromDom(action, text) {
    const recommendations = await this.recommend(action, text);
    const best = recommendations[0];

    if (!best || best.score < minimumHealingScore) {
      this.logRecommendations(action, text, recommendations);
      throw new Error(`Unable to find or heal locator for ${action} "${text}". Best score=${best?.score || 0}`);
    }

    logger.warn(
      'SELF-HEAL',
      '{} "{}" healed with score={} selector={} reason={}',
      action,
      text,
      best.score,
      best.selector,
      best.reason
    );
    this.logRecommendations(action, text, recommendations.slice(0, 3));

    return {
      locator: this.page.locator(best.selector).first(),
      strategy: 'self-healed dom recommendation',
      score: best.score,
      reason: best.reason,
      healed: true,
      recommendations
    };
  }

  async recommend(action, referenceText) {
    return this.page.evaluate(({ action, referenceText }) => {
      const wanted = normalize(referenceText);
      const elements = Array.from(document.querySelectorAll(selectorForAction(action)));

      return elements
        .filter((element) => isUsable(element))
        .map((element) => {
          const signals = elementSignals(element);
          const scoredSignals = signals.map((signal) => ({
            name: signal.name,
            value: signal.value,
            score: scoreText(wanted, normalize(signal.value))
          }));
          const bestSignal = scoredSignals.sort((left, right) => right.score - left.score)[0] || { score: 0 };
          const selector = stableSelector(element);

          return {
            selector,
            score: bestSignal.score,
            reason: `${bestSignal.name || 'unknown'} matched "${bestSignal.value || ''}"`,
            tagName: element.tagName.toLowerCase(),
            text: visibleText(element),
            attributes: {
              id: element.getAttribute('id') || '',
              name: element.getAttribute('name') || '',
              type: element.getAttribute('type') || '',
              value: element.getAttribute('value') || '',
              placeholder: element.getAttribute('placeholder') || '',
              ariaLabel: element.getAttribute('aria-label') || ''
            }
          };
        })
        .filter((item) => item.selector)
        .sort((left, right) => right.score - left.score)
        .slice(0, 5);

      function selectorForAction(currentAction) {
        const selectors = {
          click: 'button,a,input[type="button"],input[type="submit"],input[type="reset"],[role="button"],[onclick]',
          type: 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),textarea,[contenteditable="true"]',
          select: 'select',
          check: 'input[type="checkbox"],input[type="radio"]'
        };
        return selectors[currentAction] || 'button,a,input,textarea,select,[role="button"]';
      }

      function elementSignals(element) {
        return [
          { name: 'label', value: labelText(element) },
          { name: 'text', value: visibleText(element) },
          { name: 'aria-label', value: element.getAttribute('aria-label') || '' },
          { name: 'placeholder', value: element.getAttribute('placeholder') || '' },
          { name: 'name', value: element.getAttribute('name') || '' },
          { name: 'id', value: element.getAttribute('id') || '' },
          { name: 'value', value: element.getAttribute('value') || '' },
          { name: 'title', value: element.getAttribute('title') || '' }
        ].filter((signal) => signal.value);
      }

      function labelText(element) {
        if (element.labels && element.labels.length) {
          return Array.from(element.labels).map((label) => visibleText(label)).join(' ');
        }

        const id = element.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${cssEscape(id)}"]`);
          if (label) {
            return visibleText(label);
          }
        }

        const parentLabel = element.closest('label');
        if (parentLabel) {
          return visibleText(parentLabel);
        }

        const previous = element.previousElementSibling;
        if (previous && ['label', 'span', 'div', 'td'].includes(previous.tagName.toLowerCase())) {
          return visibleText(previous);
        }

        return '';
      }

      function visibleText(element) {
        return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      }

      function isUsable(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && !element.disabled
          && rect.width > 0
          && rect.height > 0;
      }

      function scoreText(expected, actual) {
        if (!actual) {
          return 0;
        }
        if (actual === expected) {
          return 100;
        }
        if (actual.includes(expected) || expected.includes(actual)) {
          return 82;
        }

        const expectedTokens = expected.split(' ').filter(Boolean);
        const actualTokens = actual.split(' ').filter(Boolean);
        const overlap = expectedTokens.filter((token) => actualTokens.includes(token)).length;
        const tokenScore = expectedTokens.length ? Math.round((overlap / expectedTokens.length) * 70) : 0;
        const distanceScore = Math.round((1 - levenshtein(expected, actual) / Math.max(expected.length, actual.length, 1)) * 80);
        return Math.max(tokenScore, distanceScore);
      }

      function normalize(value) {
        return String(value || '')
          .toLowerCase()
          .replace(/[_-]+/g, ' ')
          .replace(/[^a-z0-9 ]+/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function levenshtein(left, right) {
        const matrix = Array.from({ length: left.length + 1 }, () => []);
        for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
        for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;
        for (let i = 1; i <= left.length; i += 1) {
          for (let j = 1; j <= right.length; j += 1) {
            const cost = left[i - 1] === right[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + cost
            );
          }
        }
        return matrix[left.length][right.length];
      }

      function stableSelector(element) {
        const id = element.getAttribute('id');
        if (id) {
          return `#${cssEscape(id)}`;
        }

        const name = element.getAttribute('name');
        if (name) {
          return `${element.tagName.toLowerCase()}[name="${attrEscape(name)}"]`;
        }

        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          return `${element.tagName.toLowerCase()}[aria-label="${attrEscape(ariaLabel)}"]`;
        }

        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
          let part = current.tagName.toLowerCase();
          const siblings = Array.from(current.parentElement ? current.parentElement.children : []);
          const sameTagSiblings = siblings.filter((sibling) => sibling.tagName === current.tagName);
          if (sameTagSiblings.length > 1) {
            part += `:nth-of-type(${sameTagSiblings.indexOf(current) + 1})`;
          }
          parts.unshift(part);
          current = current.parentElement;
        }
        return parts.length ? parts.join(' > ') : '';
      }

      function cssEscape(value) {
        if (window.CSS && window.CSS.escape) {
          return window.CSS.escape(value);
        }
        return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
      }

      function attrEscape(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      }
    }, { action, referenceText });
  }

  logRecommendations(action, text, recommendations) {
    if (!recommendations.length) {
      logger.warn('AI-RECOMMENDER', '{} "{}" -> no DOM recommendations found', action, text);
      return;
    }

    recommendations.forEach((recommendation, index) => {
      logger.warn(
        'AI-RECOMMENDER',
        '#{} {} "{}" score={} selector={} reason={}',
        index + 1,
        action,
        text,
        recommendation.score,
        recommendation.selector,
        recommendation.reason
      );
    });
  }

  nameLike(text) {
    return text.replace(/\s+/g, '').replace(/^./, (value) => value.toLowerCase());
  }

  idLike(text) {
    return this.nameLike(text).replace(/[^a-zA-Z0-9_-]/g, '');
  }
}

function candidate(locator, strategy, score, reason) {
  return {
    locator,
    strategy,
    score,
    reason
  };
}

function cssString(value) {
  return JSON.stringify(String(value));
}

function attributeString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

module.exports = {
  SmartLocatorEngine
};
