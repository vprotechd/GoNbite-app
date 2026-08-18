import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

// Required for OAuth redirects to work in Expo
WebBrowser.maybeCompleteAuthSession();

// --- GOOGLE LOGIN ---
export const useGoogleLogin = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_GOOGLE_IOS_CLIENT_ID",
    androidClientId: "YOUR_GOOGLE_ANDROID_CLIENT_ID",
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result.type === "success") {
        // Fetch user info from Google
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${result.authentication?.accessToken}`
        );
        const userInfo = await res.json();

        // Send to Backend
        const apiResponse = await api.post("/auth/oauth/google", {
          email: userInfo.email,
          name: userInfo.name,
          providerId: userInfo.id,
          picture: userInfo.picture,
        });

        const { token, user } = apiResponse.data;
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false };
    } catch (error) {
      console.error("Google Error:", error);
      return { success: false };
    }
  };

  return { promptAsync: handleGoogleLogin };
};

// --- FACEBOOK LOGIN ---
export const useFacebookLogin = () => {
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: "YOUR_FACEBOOK_APP_ID",
  });

  const handleFacebookLogin = async () => {
    try {
      const result = await promptAsync();
      if (result.type === "success") {
        // Fetch user info from Facebook
        const res = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${result.authentication?.accessToken}`
        );
        const userInfo = await res.json();

        // Send to Backend
        const apiResponse = await api.post("/auth/oauth/facebook", {
          email: userInfo.email,
          name: userInfo.name,
          providerId: userInfo.id,
          picture: userInfo.picture?.data?.url,
        });

        const { token, user } = apiResponse.data;
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false };
    } catch (error) {
      console.error("Facebook Error:", error);
      return { success: false };
    }
  };

  return { promptAsync: handleFacebookLogin };
};