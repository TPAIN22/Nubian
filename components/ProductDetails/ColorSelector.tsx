import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";

interface ColorSelectorProps {
    colors: string[];
    selectedColor: string | null;
    onSelectColor: (color: string) => void;
    themeColors: any;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
    colors,
    selectedColor,
    onSelectColor,
    themeColors,
}) => {
    if (!colors || colors.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: themeColors.text.gray }]}>
                اللون: <Text style={{ fontWeight: "700" }}>{selectedColor || "Select"}</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                    {colors.map((color) => {
                        const isSelected = selectedColor === color;
                        return (
                            <TouchableOpacity
                                key={color}
                                onPress={() => onSelectColor(color)}
                                style={[
                                    styles.option,
                                    isSelected && styles.selectedOption,
                                    {
                                        backgroundColor: themeColors.cardBackground,
                                        borderColor: isSelected
                                            ? themeColors.primary
                                            : themeColors.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: getCssColor(color) },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.optionText,
                                        {
                                            color: isSelected
                                                ? themeColors.primary
                                                : themeColors.text.gray,
                                            fontWeight: isSelected ? "700" : "400",
                                        },
                                    ]}
                                >
                                    {color}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

// Helper to try and map color names to CSS/RN colors for the circle
// This is basic; in production, you might want a robust map or hex codes from backend
function getCssColor(name: string): string {
    const map: Record<string, string> = {
        red: "#ef4444",
        blue: "#3b82f6",
        green: "#22c55e",
        black: "#000000",
        white: "#ffffff",
        yellow: "#eab308",
        orange: "#f97316",
        purple: "#a855f7",
        pink: "#ec4899",
        gray: "#6b7280",
        // Arabic mapping
        أحمر: "#ef4444",
        أزرق: "#3b82f6",
        اخضر: "#22c55e",
        أخضر: "#22c55e",
        أسود: "#000000",
        ابيض: "#ffffff",
        أبيض: "#ffffff",
        أصفر: "#eab308",
        برتقالي: "#f97316",
        بنفسجي: "#a855f7",
        زهري: "#ec4899",
        رمادي: "#6b7280",
    };
    return map[name.toLowerCase()] || "#cccccc";
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: "left", // Enforce LTR/RTL via I18nManager if needed, but text-align helps
    },
    optionsContainer: {
        flexDirection: "row",
        gap: 10,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 80,
        justifyContent: "center",
    },
    selectedOption: {
        borderWidth: 2,
    },
    colorCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    optionText: {
        fontSize: 14,
    },
});
