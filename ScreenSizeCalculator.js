const {WzwScreen, DEFAULT_OPTION} = require("./src/platform/WzwScreen");

console.log(WzwScreen.ScreenSizeCalculator(
    DEFAULT_OPTION.atomSpace,
    DEFAULT_OPTION.atomBorder,
    DEFAULT_OPTION.atomInset,
    1,
    DEFAULT_OPTION.atomColCount,
    DEFAULT_OPTION.atomRowCount,
    DEFAULT_OPTION.splitPosition
));