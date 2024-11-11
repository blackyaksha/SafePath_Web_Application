import { View, Text, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomBotton';
import { Link, router } from 'expo-router';

const SignIn = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
    }

    setSubmitting(true);

    try {
      await signIn(form.email, form.password);
      const result = await getCurrentUser();
      setUser(result);
      setIsLogged(true);

      Alert.alert("Success", "User signed in successfully");
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          className="w-full px-7 bg-primary"
        >
          
          <Text className="text-4xl font-bold text-black mt-5 font-ibold">
            Login
          </Text>

          <Text className="text-l font-semibold text-gray-500 mt-2 font-isemibold">
            Please sign in to continue.
          </Text>

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-10"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-5"
          />

          <CustomButton
            title="Sign In"
            handlePress={() => router.push('/home')}
            containerStyles="mt-10"
            isLoading={isSubmitting}
          />

        <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-iregular">
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              className="text-lg font-isemibold text-secondary"
            >
              Signup
            </Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
