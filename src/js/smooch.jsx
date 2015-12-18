import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import uuid from 'uuid';

import { store } from 'stores/app-store';
import { Widget } from 'components/widget.jsx';

import { setAuth, resetAuth } from 'actions/auth-actions';
import { setUser, resetUser } from 'actions/user-actions';
import { setConversation } from 'actions/conversation-actions';
import { openWidget, closeWidget } from 'actions/app-state-actions';

import { login } from 'services/auth-service';
import { trackEvent, update as updateUser } from 'services/user-service';
import { getConversation, sendMessage, connectFaye, disconnectFaye } from 'services/conversation-service';

import { storage } from 'utils/storage';

function renderWidget() {
    const el = document.createElement('div');
    el.setAttribute('id', 'sk-holder');
    el.className = 'sk-noanimation';

    render(<Provider store={store}><Widget /></Provider>, el);

    const appendWidget = () => {
        document.body.appendChild(el);
        setTimeout(() => el.className = '', 200);
    }

    if (document.readyState == 'complete' || document.readyState == 'loaded' || document.readyState == 'interactive') {
        appendWidget();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            appendWidget();
        });
    }

    return el;
}

function getDeviceId() {
    const SK_STORAGE = 'sk_deviceid';
    const deviceId = storage.getItem(SK_STORAGE) ||
        uuid.v4().replace(/-/g, '');

    storage.setItem(SK_STORAGE, deviceId);

    return deviceId;
}


export class Smooch {
    get VERSION() {
        return VERSION;
    }

    init(props) {
        this.appToken = props.appToken;

        // TODO : accept user attributes
        return this.login(props.userId);
    }

    login(userId, jwt) {
        // TODO : accept user attributes
        return Promise.resolve().then(() => {
            store.dispatch(setAuth({
                jwt: jwt,
                appToken: this.appToken
            }));

            // TODO : add more info on the device
            return login({
                userId: userId,
                device: {
                    platform: 'web',
                    id: getDeviceId(),
                    info: {
                        sdkVersion: VERSION,
                        URL: document.location.host,
                        userAgent: navigator.userAgent,
                        referrer: document.referrer,
                        browserLanguage: navigator.language,
                        currentUrl: document.location.href,
                        currentTitle: document.title
                    }
                }
            });
        }).then((loginResponse) => {
            store.dispatch(setUser(loginResponse.appUser));
            const user = store.getState().user;

            if (user.conversationStarted) {
                return getConversation().then((conversationResponse) => {
                    store.dispatch(setConversation(conversationResponse.conversation));
                    return connectFaye();
                });
            }
        }).then(() => {
            if (!this._el) {
                this._el = renderWidget();
            }

            this.ready = true;
        });
    }

    logout() {
        store.dispatch(resetAuth());
        store.dispatch(resetUser());
        disconnectFaye();

        return this.login();
    }

    track(eventName, userProps) {
        return trackEvent(eventName, userProps).then((response) => {
            if (response.conversationUpdated) {
                return getConversation().then((conversationResponse) => {
                    store.dispatch(setConversation(conversationResponse.conversation));
                    return connectFaye();
                }).then(() => {
                    return response;
                });
            }

            return response;
        });
    }

    sendMessage(text) {
        // TODO : connect faye first
        return sendMessage(text)
    }

    updateUser(props) {
        // TODO : check if conversation started on server response
        return updateUser(props);
    }

    destroy() {
        disconnectFaye();
        document.body.removeChild(this._el);
        delete this._el;
    }

    open() {
        store.dispatch(openWidget());
    }

    close() {
        store.dispatch(closeWidget());
    }
}
