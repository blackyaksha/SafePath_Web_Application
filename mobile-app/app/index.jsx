import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from "../components/CustomButton";
import { Redirect, router } from 'expo-router';

export default function App() {
    return (
        <SafeAreaView className="bg-primary h-full">
            <View className="flex-1"> 
            <ImageBackground
                source={images.background}
                className="flex-1 justify-center items-center" // Full height and center content
                resizeMode="cover"
            />

            <ScrollView
                contentContainerStyle={{
                    paddingTop: 150,
                    flexGrow: 1, // Allow ScrollView to grow
                    justifyContent: 'center', // Center content vertically
                }}
            >
                <View className="w-full flex-0.5 min-h-[100px] justify-center mt-3 items-center h-full px-8">
                    
                    <Image
                        source={images.logo}
                        className="w-[300px] h-[180px]"
                        resizeMode="contain"
                    />

                    <View className="relative mt-1">
                        <Text className="text-2xl text-iblack font-bold text-center">
                            Optimize Your Way Out of Disasters
                        </Text>
                    </View>
                    
                    <Text className="text-xs font-iregular text-iblack mt-4 text-center">
                        Utilize our advanced mapping technology for safer evacuations.
                    </Text>

                    <CustomButton 
                        title="Get started"
                        handlePress={() => router.push('/sign-in')} 
                        containerStyles="w-full mt-40"

                    />
                </View>
            </ScrollView>
            </View>
            <StatusBar backgroundColor='#FFFFFF' style='dark' />
        </SafeAreaView>
    );
}