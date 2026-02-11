import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | null;
    onSelectSize: (size: string) => void;
    themeColors: any;
    disabled?: boolean;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
    sizes,
    selectedSize,
    onSelectSize,
    themeColors,
    disabled,
}) => {
    if (!sizes || sizes.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: themeColors.text.gray }]}>
                المقاس: <Text style={{ fontWeight: "700" }}>{selectedSize || "Select"}</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                    {sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                            <TouchableOpacity
                                key={size}
                                onPress={() => !disabled && onSelectSize(size)}
                                disabled={disabled}
                                style={[
                                    styles.option,
                                    isSelected && styles.selectedOption,
                                    {
                                        backgroundColor: themeColors.cardBackground,
                                        borderColor: isSelected
                                            ? themeColors.primary
                                            : themeColors.border,
                                        opacity: disabled ? 0.5 : 1,
                                    },
                                ]}
                            >
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
                                    {size}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    optionsContainer: {
        flexDirection: "row",
        gap: 10,
    },
    option: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 50,
    },
    selectedOption: {
        borderWidth: 2,
    },
    optionText: {
        fontSize: 14,
    },
});
