import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import api from "./api";

// Required for OAuth redirects
WebBrowser.maybeCompleteAuthSession();

// =====================================================
// GOOGLE CONFIG
// =====================================================

const GOOGLE_WEB_CLIENT_ID =
  "614009639746-ag91pl4apbplr31fhej0dm6egn69rgff.apps.googleusercontent.com";

const GOOGLE_ANDROID_CLIENT_ID =
  "614009639746-2nn4lq3mqjhdu7sa5eosc7luil6beu2i.apps.googleusercontent.com";

// =====================================================
// GOOGLE LOGIN
// =====================================================

export const useGoogleLogin = () => {
  const redirectUri =
    Platform.OS === "web"
      ? window.location.hostname === "localhost"
        ? "http://localhost:8081/oauthredirect"
        : "https://gonbite-app-1.onrender.com/oauthredirect"
      : makeRedirectUri({
          native: "gonbite://oauthredirect",
        });

  console.log("=================================");
  console.log("🔗 GOOGLE REDIRECT URI:", redirectUri);
  console.log("=================================");

  const [request, response, promptAsync] =
    Google.useAuthRequest({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,

      redirectUri,

      scopes: [
        "openid",
        "profile",
        "email",
      ],

      selectAccount: true,

      // Important:
      // Web -> token is returned directly
      // Android -> Google provider uses code flow
      responseType:
        Platform.OS === "web"
          ? ResponseType.Token
          : ResponseType.Code,
    });

  const handleGoogleLogin = async () => {
    try {
      console.log("=================================");
      console.log("🔵 GOOGLE LOGIN START");
      console.log("=================================");
      console.log("🔵 Platform:", Platform.OS);
      console.log("🔗 Redirect URI:", redirectUri);

      if (!request) {
        console.log(
          "❌ Google auth request is not ready yet."
        );

        return {
          success: false,
        };
      }

      console.log("🔵 Opening Google OAuth...");

      const result = await promptAsync();

      console.log(
        "🔵 Google OAuth result:",
        result
      );

      if (result?.type !== "success") {
        console.log(
          "❌ Google login cancelled or failed:",
          result?.type
        );

        if (result?.type === "error") {
          console.error(
            "❌ Google OAuth error:",
            result.error
          );
        }

        return {
          success: false,
        };
      }

      // =================================================
      // GET ACCESS TOKEN
      // =================================================

      let accessToken =
        result.authentication?.accessToken;

      // Web token flow can also return the token
      // inside params.
      if (!accessToken) {
        accessToken =
          result.params?.access_token;
      }

      if (!accessToken) {
        console.error(
          "❌ Google access token not received."
        );

        console.log(
          "🔍 Google result params:",
          result.params
        );

        console.log(
          "🔍 Google authentication:",
          result.authentication
        );

        return {
          success: false,
        };
      }

      console.log(
        "✅ Google access token received."
      );

      // =================================================
      // SEND TOKEN TO GONBITE BACKEND
      // =================================================

      console.log(
        "🔵 Sending Google token to backend..."
      );

      const apiResponse = await api.post(
        "/auth/oauth/google",
        {
          accessToken,
        }
      );

      console.log(
        "✅ Google backend response:",
        apiResponse.data
      );

      // =================================================
      // GET GONBITE JWT
      // =================================================

      const { token, user } =
        apiResponse.data;

      if (!token || !user) {
        console.error(
          "❌ Invalid Google backend response."
        );

        return {
          success: false,
        };
      }

      // =================================================
      // SAVE LOGIN SESSION
      // =================================================

      await AsyncStorage.setItem(
        "token",
        token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      console.log(
        "================================="
      );

      console.log(
        "✅ GOOGLE LOGIN SUCCESS"
      );

      console.log(
        "👤 User:",
        user.email
      );

      console.log(
        "================================="
      );

      return {
        success: true,
        user,
      };

    } catch (error: any) {
      console.error(
        "================================="
      );

      console.error(
        "❌ GOOGLE LOGIN ERROR"
      );

      console.error(
        error?.response?.data ||
          error?.message ||
          error
      );

      console.error(
        "================================="
      );

      return {
        success: false,
      };
    }
  };

  return {
    request,
    response,
    promptAsync: handleGoogleLogin,
  };
};

// =====================================================
// FACEBOOK LOGIN
// =====================================================

const FACEBOOK_APP_ID =
  "1013626601365790";

export const useFacebookLogin = () => {
  const redirectUri =
    Platform.OS === "web"
      ? window.location.hostname === "localhost"
        ? "http://localhost:8081/facebook"
        : "https://gonbite-app-1.onrender.com/facebook"
      : makeRedirectUri({
          native: "gonbite://facebook",
        });

  console.log(
    "🔗 FACEBOOK REDIRECT URI:",
    redirectUri
  );

  const [request, response, promptAsync] =
    Facebook.useAuthRequest({
      clientId: FACEBOOK_APP_ID,

      webClientId: FACEBOOK_APP_ID,

      androidClientId: FACEBOOK_APP_ID,

      redirectUri,

      scopes: [
        "public_profile",
        "email",
      ],
    });

  const handleFacebookLogin = async () => {
    try {
      console.log(
        "🔵 Starting Facebook login..."
      );

      console.log(
        "🔗 Facebook Redirect URI:",
        redirectUri
      );

      if (!request) {
        console.log(
          "❌ Facebook auth request is not ready yet."
        );

        return {
          success: false,
        };
      }

      const result = await promptAsync();

      console.log(
        "🔵 Facebook OAuth result:",
        result
      );

      if (result?.type !== "success") {
        console.log(
          "❌ Facebook login cancelled or failed:",
          result?.type
        );

        return {
          success: false,
        };
      }

      let accessToken =
        result.authentication?.accessToken;

      if (!accessToken) {
        accessToken =
          result.params?.access_token;
      }

      if (!accessToken) {
        console.error(
          "❌ Facebook access token not received."
        );

        return {
          success: false,
        };
      }

      console.log(
        "✅ Facebook access token received."
      );

      const apiResponse = await api.post(
        "/auth/oauth/facebook",
        {
          accessToken,
        }
      );

      console.log(
        "✅ Facebook backend response:",
        apiResponse.data
      );

      const { token, user } =
        apiResponse.data;

      if (!token || !user) {
        console.error(
          "❌ Invalid Facebook backend response."
        );

        return {
          success: false,
        };
      }

      await AsyncStorage.setItem(
        "token",
        token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      console.log(
        "✅ Facebook login successful:",
        user.email
      );

      return {
        success: true,
        user,
      };

    } catch (error: any) {
      console.error(
        "❌ Facebook Login Error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      return {
        success: false,
      };
    }
  };

  return {
    request,
    response,
    promptAsync: handleFacebookLogin,
  };
};