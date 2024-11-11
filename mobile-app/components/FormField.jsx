import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useState } from "react";
import { icons } from "../constants";

const FormField = ({ title, value, placeholder, handleChangeText, otherStyles, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View className={`space-y-2 ${otherStyles}`}>
            <Text className="text-base text-gray-500 font-imedium">{title}</Text>
            <View
                className="
                border-2 
                boarder-grey-500
                w-full 
                h-16 
                px-4 
                bg-gray-200 
                rounded-2xl
                focus: border-secondary 
                items-center
                flex-row"
            >
                <TextInput
                    className="flex-1 text-black font-isemibold text-base"
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor='black'
                    onChangeText={handleChangeText}
                    secureTextEntry={title === 'Password' && !showPassword}
                />

                {title === "Password" && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Image
                            source={!showPassword ? icons.eye : icons.eyehide}
                            className="w-7 h-7"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
export default FormField;
