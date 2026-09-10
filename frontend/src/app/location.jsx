import { Platform } from "react-native";
import LocationNative from "./location.native";
import LocationWeb from "./location.web";

export default function LocationScreen() {
  if (Platform.OS === "web") {
    return <LocationWeb />;
  }

  return <LocationNative />;
}