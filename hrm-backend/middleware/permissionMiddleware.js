const { authorizePermission, canPerform } = require("../utils/permissions");

module.exports = authorizePermission;
module.exports.authorizePermission = authorizePermission;
module.exports.canPerform = canPerform;
