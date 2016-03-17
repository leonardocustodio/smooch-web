import isMobile from 'ismobilejs';

const pushState = window.history.pushState;
const replaceState = window.history.replaceState;

let monitorCallback;

export function waitForPage() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                resolve();
            });
        }
    });
}

export function preventMobilePageScroll() {
    const htmlEl = document.querySelector('html');
    htmlEl.classList.add('sk-widget-opened');
    if (isMobile.apple.device) {
        htmlEl.classList.add('sk-ios-device');
    }
}

export function allowMobilePageScroll() {
    const htmlEl = document.querySelector('html');
    htmlEl.classList.remove('sk-widget-opened');
    if (isMobile.apple.device) {
        htmlEl.classList.remove('sk-ios-device');
    }
}

export function monitorUrlChanges(callback) {
    stopMonitoring();

    monitorCallback = callback;
    window.addEventListener('hashchange', monitorCallback);

    window.history.pushState = (state, title, url, ...rest) => {
        pushState && pushState.apply(window.history, [state, title, url, ...rest]);

        if (url) {
            monitorCallback();
        }
    };

    window.history.replaceState = (state, title, url, ...rest) => {
        replaceState && replaceState.apply(window.history, [state, title, url, ...rest]);

        if (url) {
            monitorCallback();
        }
    };
}

export function stopMonitoring() {
    if (monitorCallback) {
        window.removeEventListener('hashchange', monitorCallback);
        window.history.pushState = pushState;
        window.history.replaceState = replaceState;
    }
}
