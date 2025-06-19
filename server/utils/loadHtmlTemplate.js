const fs = require("fs");
const path = require("path");

const loadHtmlTemplate = (templateName, replacements) => {
  const filePath = path.join(__dirname, `../templates/${templateName}.html`);
  let template = fs.readFileSync(filePath, "utf-8");

  for (const key in replacements) {
    const regex = new RegExp(`{{${key}}}`, "g");
    template = template.replace(regex, replacements[key]);
  }

  return template;
};

module.exports = loadHtmlTemplate;
