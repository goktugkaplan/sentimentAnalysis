// HomeScreen.tsx
import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen: FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>Hoşgeldiniz</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center', // dikey ortala
        alignItems: 'center',     // yatay ortala
        backgroundColor: '#fff',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
