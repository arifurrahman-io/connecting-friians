import { Slot } from "expo-router";

export default function PublicLayout() {
  // This tells Expo Router to just render the children
  // (login, register, etc.) without any extra UI wrappers.
  return <Slot />;
}
