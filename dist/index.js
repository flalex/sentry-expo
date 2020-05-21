"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var expo_constants_1 = __importDefault(require("expo-constants"));
var react_native_1 = require("react-native");
var react_native_2 = require("@sentry/react-native");
var integrations_1 = require("@sentry/integrations");
var browser_1 = require("@sentry/browser");
exports.Native = __importStar(require("@sentry/react-native"));
exports.Browser = __importStar(require("@sentry/browser"));
/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url) {
    return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}
function normalizeUrl(url) {
    if (isPublishedExpoUrl(url)) {
        return "app:///main." + react_native_1.Platform.OS + ".bundle";
    }
    else {
        return url;
    }
}
var ExpoIntegration = /** @class */ (function () {
    function ExpoIntegration() {
        this.name = ExpoIntegration.id;
    }
    ExpoIntegration.prototype.setupOnce = function () {
        react_native_2.setExtras({
            manifest: expo_constants_1.default.manifest,
            deviceYearClass: expo_constants_1.default.deviceYearClass,
            linkingUri: expo_constants_1.default.linkingUri,
        });
        react_native_2.setTags({
            deviceId: expo_constants_1.default.installationId,
            appOwnership: expo_constants_1.default.appOwnership,
            expoVersion: expo_constants_1.default.expoVersion,
        });
        if (!!expo_constants_1.default.manifest) {
            if (expo_constants_1.default.manifest.releaseChannel) {
                react_native_2.setTag('expoReleaseChannel', expo_constants_1.default.manifest.releaseChannel);
            }
            if (expo_constants_1.default.manifest.version) {
                react_native_2.setTag('expoAppVersion', expo_constants_1.default.manifest.version);
            }
            if (expo_constants_1.default.manifest.publishedTime) {
                react_native_2.setTag('expoAppPublishedTime', expo_constants_1.default.manifest.publishedTime);
            }
        }
        if (expo_constants_1.default.sdkVersion) {
            react_native_2.setTag('expoSdkVersion', expo_constants_1.default.sdkVersion);
        }
        var defaultHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            // On Android, the Expo bundle filepath cannot be handled by TraceKit,
            // so we normalize it to use the same filepath that we use on Expo iOS.
            if (react_native_1.Platform.OS === 'android') {
                error.stack = error.stack.replace(/\/.*\/\d+\.\d+.\d+\/cached\-bundle\-experience\-/g, 'https://d1wp6m56sqw74a.cloudfront.net:443/');
            }
            react_native_2.getCurrentHub().withScope(function (scope) {
                if (isFatal) {
                    scope.setLevel(react_native_2.Severity.Fatal);
                }
                react_native_2.getCurrentHub().captureException(error, {
                    originalException: error,
                });
            });
            var client = react_native_2.getCurrentHub().getClient();
            if (client && !__DEV__) {
                client.flush(2000).then(function () {
                    defaultHandler(error, isFatal);
                });
            }
            else {
                // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
                defaultHandler(error, isFatal);
            }
        });
        react_native_2.addGlobalEventProcessor(function (event, _hint) {
            var _a, _b;
            var that = react_native_2.getCurrentHub().getIntegration(ExpoIntegration);
            if (that) {
                var additionalDeviceInformation = {};
                if (react_native_1.Platform.OS === 'ios') {
                    additionalDeviceInformation = {
                        model: (_b = (_a = expo_constants_1.default.platform) === null || _a === void 0 ? void 0 : _a.ios) === null || _b === void 0 ? void 0 : _b.model,
                    };
                }
                else {
                    additionalDeviceInformation = {
                        model: 'n/a',
                    };
                }
                event.contexts = __assign(__assign({}, (event.contexts || {})), { device: __assign({ simulator: !expo_constants_1.default.isDevice }, additionalDeviceInformation), os: {
                        name: react_native_1.Platform.OS === 'ios' ? 'iOS' : 'Android',
                        version: "" + react_native_1.Platform.Version,
                    } });
            }
            return event;
        });
    };
    ExpoIntegration.id = 'ExpoIntegration';
    return ExpoIntegration;
}());
exports.init = function (options) {
    var _a, _b, _c;
    if (options === void 0) { options = {}; }
    if (react_native_1.Platform.OS === 'web') {
        return browser_1.init(__assign(__assign({}, options), { enabled: __DEV__ ? (_a = options.enableInExpoDevelopment) !== null && _a !== void 0 ? _a : false : true }));
    }
    var optionsCopy = __assign({}, options);
    optionsCopy.integrations = __spreadArrays((typeof optionsCopy.integrations === 'object'
        ? (_b = optionsCopy.integrations) !== null && _b !== void 0 ? _b : [] : ((_c = optionsCopy === null || optionsCopy === void 0 ? void 0 : optionsCopy.integrations) !== null && _c !== void 0 ? _c : (function () { return []; }))([])), [
        new react_native_2.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        new ExpoIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: function (frame) {
                if (frame.filename) {
                    frame.filename = normalizeUrl(frame.filename);
                }
                return frame;
            },
        }),
    ]);
    var release = !!expo_constants_1.default.manifest
        ? expo_constants_1.default.manifest.revisionId || 'UNVERSIONED'
        : Date.now();
    // Bail out automatically if the app isn't deployed
    if (release === 'UNVERSIONED' && !optionsCopy.enableInExpoDevelopment) {
        optionsCopy.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    // We don't want to have the native nagger.
    optionsCopy.enableNativeNagger = false;
    return react_native_2.init(__assign(__assign({}, optionsCopy), { release: release }));
};
