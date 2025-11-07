import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { API_URL } from "../../services/Config";

type RootStackParamList = {
    Register: undefined;
    Chatbot: {
        userId: string;
    };
};

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

const RegisterPage: React.FC = () => {
    const navigation = useNavigation<RegisterNavigationProp>();

    const [username, setUsername] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const isSubmitDisabled = useMemo(() => loading, [loading]);

    const handleRegister = useCallback(async () => {
        if (loading) {
            return;
        }

        setError("");
        setSuccess("");

        if (!username.trim()) {
            setError("Kullanıcı adı boş olamaz!");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/api/user/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(username),
            });

            if (!response.ok) {
                const message = await response.text();
                setError(message || "Kayıt başarısız!");
                return;
            }

            const data: { id: string } = await response.json();
            setSuccess("Kayıt başarılı!");

            setTimeout(() => {
                navigation.navigate("Chatbot", { userId: data.id });
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Sunucuya bağlanılamadı!");
        } finally {
            setLoading(false);
        }
    }, [loading, navigation, username]);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Kayıt Ol</Text>

                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Kullanıcı Adı"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, !!error && !success ? styles.inputError : null]}
                />

                {!!error && !success && <Text style={styles.errorText}>{error}</Text>}
                {!!success && <Text style={styles.successText}>{success}</Text>}

                <TouchableOpacity
                    style={[styles.button, isSubmitDisabled ? styles.buttonDisabled : null]}
                    onPress={handleRegister}
                    disabled={isSubmitDisabled}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#309dff",
        paddingHorizontal: 24,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        padding: 24,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 24,
        color: "#0f1923",
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: "#d0d7de",
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: "#f8f9fb",
        color: "#0f1923",
    },
    inputError: {
        borderColor: "#d93025",
    },
    errorText: {
        marginTop: 8,
        color: "#d93025",
        fontSize: 14,
    },
    successText: {
        marginTop: 8,
        color: "#0f9d58",
        fontSize: 14,
    },
    button: {
        marginTop: 24,
        height: 48,
        borderRadius: 8,
        backgroundColor: "#309dff",
        justifyContent: "center",
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default RegisterPage;


