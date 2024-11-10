import { View, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';

const TabIcon = ({ icon, focused }) => {
  return (
    <View className={`w-12 h-12 rounded-full ${focused ? 'bg-[#C4C98C]' : 'bg-transparent'} flex items-center justify-center`}>
      <Image
        source={icon}
        className={`w-10 h-10 ${focused ? 'tint-[#C4C98C]' : 'tint-[#C4C98C]'}`} // Change color based on focus
      />
    </View>
  );
};

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#000000", // Background color
            borderTopWidth: 1, // Border width
            borderTopColor: "#232533", // Border color
            height: 60, // Height of the tab bar
            position: 'absolute', // Positioning
            left: 20,
            right: 20,
            bottom: 30,
            marginHorizontal: 'auto', // Centering
            borderRadius: 30, // Optional: rounded corners
            shadowColor: '#000', // Shadow color
            shadowOffset: { width: 0, height: 2 }, // Shadow offset
            shadowOpacity: 0.25, // Shadow opacity
            shadowRadius: 3.5, // Shadow radius
            elevation: 5, // Android shadow
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                icon={icons.home}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="explore-maps"
          options={{
            title: 'Explore Maps',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                icon={icons.mapsearch}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="optimize-route"
          options={{
            title: 'Optimize Route',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                icon={icons.route}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="report-hazard"
          options={{
            title: 'Report Hazard',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                icon={icons.reporthazard}
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: 'Notification',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon 
                icon={icons.notification}
                focused={focused}
              />
            )
          }}
        />
      </Tabs>
    </>
  );
}

export default TabsLayout;