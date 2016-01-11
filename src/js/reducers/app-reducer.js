import { SET_PUBLIC_KEYS, RESET_APP } from 'actions/app-actions';
import { RESET } from 'actions/common-actions';

const INITIAL_STATE = {
    publicKeys: {}
};

export function AppReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case RESET:
        case RESET_APP:
            return Object.assign({}, INITIAL_STATE);
        case SET_PUBLIC_KEYS:
            return Object.assign({}, state, {
                publicKeys: action.keys
            });
        default:
            return state;
    }
}
