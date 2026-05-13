// Test the preprocessing logic for GitHub-style alerts  

const testMarkdown = `> [!NOTE]
>You can create up to 5 business profiles per account. Need more? Contact your organization administrator.`;

const preprocessAlerts = (markdown) => {
    const alertTypes = {
        '[!NOTE]': { class: 'alert-note', icon: 'ℹ️', label: 'Note' },
        '[!TIP]': { class: 'alert-tip', icon: '💡', label: 'Tip' },
        '[!IMPORTANT]': { class: 'alert-important', icon: '❗', label: 'Important' },
        '[!WARNING]': { class: 'alert-warning', icon: '⚠️', label: 'Warning' },
        '[!CAUTION]': { class: 'alert-caution', icon: '🚨', label: 'Caution' }
    };

    let processed = markdown;

    // Replace each alert type
    for (const [marker, config] of Object.entries(alertTypes)) {
        const regex = new RegExp(`^>\\s*${marker.replace('[', '\\[').replace(']', '\\]')}\\s*\\n((?:>.*\\n?)*)`, 'gm');

        processed = processed.replace(regex, (match, content) => { 
            // Extract content from blockquote lines
            const lines = content.split('\\n')
                .map(line => line.replace(/^>\\s?/, '').trim())
                .filter(line => line.length > 0)
                .join('\\n');

            return `<div class="academy-alert ${config.class}">
  <div class="alert-header">
    <span class="alert-icon">${config.icon}</span>
    <span class="alert-label">${config.label}</span>
  </div>
  <div class="alert-content">

${lines}

  </div>
</div>

`;
        });
    }

    return processed;
};
 
const result = preprocessAlerts(testMarkdown); 