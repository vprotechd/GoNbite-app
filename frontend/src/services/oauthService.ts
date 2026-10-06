import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import {
  makeRedirectUri,
} from "expo-auth-session";
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
  // ---------------------------------------------------
  // PLATFORM-SPECIFIC REDIRECT URI
  // ---------------------------------------------------

  const redirectUri = makeRedirectUri({
    scheme: "gonbite",
    path: "oauthredirect",
  });

  console.log("🔗 GOOGLE REDIRECT URI:", redirectUri);

  // ---------------------------------------------------
  // GOOGLE AUTH REQUEST
  // ---------------------------------------------------

  const [request, response, promptAsync] =
    Google.useAuthRequest({
      // WEB
      webClientId: GOOGLE_WEB_CLIENT_ID,

      // ANDROID
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,

      // Explicit redirect
      redirectUri,

      // Ask Google for basic profile information
      scopes: [
        "openid",
        "profile",
        "email",
      ],

      // Always allow account selection
      selectAccount: true,
    });

  // ---------------------------------------------------
  // HANDLE GOOGLE LOGIN
  // ---------------------------------------------------

  const handleGoogleLogin = async () => {
    try {
      console.log("🔵 Starting Google login...");
      console.log(
        "🔵 Platform:",
        Platform.OS
      );
      console.log(
        "🔗 Redirect URI:",
        redirectUri
      );

      if (!request) {
        console.log(
          "❌ Google auth request is not ready yet."
        );

        return {
          success: false,
        };
      }

      // ------------------------------------------------
      // OPEN GOOGLE LOGIN
      // ------------------------------------------------

      const result = await promptAsync();

      console.log(
        "🔵 Google OAuth result:",
        result
      );

      // ------------------------------------------------
      // USER CANCELLED / FAILED
      // ------------------------------------------------

      if (result?.type !== "success") {
        console.log(
          "❌ Google login cancelled or failed:",
          result?.type
        );

        return {
          success: false,
        };
      }

      // ------------------------------------------------
      // GET ACCESS TOKEN
      // ------------------------------------------------

      const accessToken =
        result.authentication?.accessToken;

      if (!accessToken) {
        console.error(
          "❌ Google access token not received."
        );

        return {
          success: false,
        };
      }

      console.log(
        "✅ Google access token received."
      );

      // ------------------------------------------------
      // SEND GOOGLE TOKEN TO GONBITE BACKEND
      // ------------------------------------------------

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

      // ------------------------------------------------
      // GET GONBITE JWT
      // ------------------------------------------------

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

      // ------------------------------------------------
      // SAVE LOGIN SESSION
      // ------------------------------------------------

      await AsyncStorage.setItem(
        "token",
        token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      console.log(
        "✅ Google login successful:",
        user.email
      );

      return {
        success: true,
        user,
      };

    } catch (error: any) {
      console.error(
        "❌ Google Login Error:",
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
    promptAsync: handleGoogleLogin,
  };
};

// =====================================================
// FACEBOOK LOGIN
// =====================================================

const FACEBOOK_APP_ID =
  "1013626601365790";

export const useFacebookLogin = () => {
  const redirectUri = makeRedirectUri({
    scheme: "gonbite",
    path: "facebook",
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

      const accessToken =
        result.authentication?.accessToken;

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

