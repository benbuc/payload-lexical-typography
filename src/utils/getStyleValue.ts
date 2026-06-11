export const getStyleValue = (style: string, property: string): string => {
  const escapedProperty = property.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = new RegExp(`(?:^|;)\\s?${escapedProperty}: ([^;]+)`).exec(style);
  return match ? match[1].trim() : "";
};
