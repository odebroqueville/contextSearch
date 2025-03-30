(function () {
    let s = !1,
        themeToggle,
        n;

    document.addEventListener("DOMContentLoaded", () => {
        setupThemeToggle();
        const storedTheme = JSON.parse(localStorage.theme);
        const theme = storedTheme.theme === "dark";

        const tooltip = document.getElementById("ThemeToggle--tooltip");
        while (tooltip.firstChild) {
            tooltip.removeChild(tooltip.firstChild);
        }

        const textNode = document.createTextNode(`Set theme to ${theme ? "light" : "dark"} (\u21E7+D)`);
        tooltip.appendChild(textNode);
    }), (themeToggle = document.querySelector("#ThemeToggle")), (s = !themeToggle);

    function setTheme(isDarkMode) {
        const theme = isDarkMode ? "dark" : "light";
        document.documentElement.setAttribute("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.theme = JSON.stringify({ theme });
        if (themeToggle) {
            themeToggle.checked = isDarkMode;
            s = false;
        } else if (s) {
            setTimeout(setTheme, 1, isDarkMode);
        }
    }

    function toggleTheme(isDarkMode) {
        setTheme(isDarkMode);
        const tooltip = document.getElementById("ThemeToggle--tooltip");
        while (tooltip.firstChild) {
            tooltip.removeChild(tooltip.firstChild);
        }

        const textNode = document.createTextNode(`Set theme to ${isDarkMode ? "light" : "dark"} (\u21E7+D)`);
        tooltip.appendChild(textNode);
    }

    function setupThemeToggle() {
        const themeToggle = document.querySelector("#ThemeToggle");

        themeToggle.addEventListener("change", () => toggleTheme(themeToggle.checked));

        document.addEventListener("keydown", (event) => {
            const isBodyElement = event.target === document.body;
            const isKeyPressD = event.key === "D" || event.key === "d";
            const isShiftKey = event.shiftKey;

            if (isBodyElement && isKeyPressD && isShiftKey) {
                event.preventDefault();
                toggleTheme(!themeToggle.checked);
            }
        });
    }

    try {
        (n = window.matchMedia("(prefers-color-scheme:dark)")), (n.onchange = (e) => setTheme(e.matches));
    } catch (error) {
        console.warn("Could not set up prefers-color-scheme listener:", error);
    }

    try {
        let e = localStorage.theme,
            s = e && JSON.parse(e);
        setTheme(s ? /dark/.test(s.theme) : !!(n && n.matches));
    } catch (error) {
        console.warn("Could not load theme from localStorage:", error);
    }
})();
