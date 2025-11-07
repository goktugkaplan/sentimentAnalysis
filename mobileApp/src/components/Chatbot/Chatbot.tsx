import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { API_URL } from "../../services/Config";

type RootStackParamList = {
    Register: undefined;
    Chatbot: {
        userId: string;
    };
};

type ChatbotNavigationProp = NativeStackNavigationProp<RootStackParamList, "Chatbot">;
type ChatbotRouteProp = RouteProp<RootStackParamList, "Chatbot">;

type Emotion = {
    type: "positive" | "negative" | "neutral";
    confidence: number;
    score: number;
    icon: string;
    label: string;
    probs?: {
        positive?: number;
        negative?: number;
        neutral?: number;
    };
    error?: boolean;
};

type Message = {
    id: number;
    text: string;
    sender: "user" | "bot";
    time: string;
    emotion?: Emotion;
};

const ogreniyorumIcon = require("./bot.png");

const translations = {
    tr: {
        headerTitle: "Duygu Analiz Botu",
        statusText: "Çevrimiçi • Mesajlarınızı analiz ediyor",
        welcomeTitle: "Duygu Analiz Botuna Hoş Geldiniz!",
        welcomeText:
            "Mesajlarınızı yazın, ben de duygularınızı analiz edeyim. Pozitif, negatif veya nötr duyguları tespit edebilirim.",
        statLabel: "Analiz Edilen",
        placeholder: "Duygularınızı paylaşın, analiz edeyim...",
        positive: "Pozitif",
        negative: "Negatif",
        neutral: "Nötr",
        analysisResult: "Analiz Sonucu:",
        analysisText: "Mesajınız",
        analysisText2: "duygu içeriyor.",
        confidenceScore: "Güven skoru:",
        errorText: "Üzgünüm, analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.",
    },
    en: {
        headerTitle: "Emotion Analysis Bot",
        statusText: "Online • Analyzing your messages",
        welcomeTitle: "Welcome to Emotion Analysis Bot!",
        welcomeText:
            "Write your messages, and I will analyze your emotions. I can detect positive, negative, or neutral emotions.",
        statLabel: "Analyzed",
        placeholder: "Share your feelings, I'll analyze them...",
        positive: "Positive",
        negative: "Negative",
        neutral: "Neutral",
        analysisResult: "Analysis Result:",
        analysisText: "Your message contains",
        analysisText2: "emotion.",
        confidenceScore: "Confidence score:",
        errorText: "Sorry, an error occurred during analysis. Please try again.",
    },
};

const TypingIndicator: React.FC = () => {
    const animations = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const loops = animations.map((anim, index) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -6,
                        duration: 220,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                        delay: index * 150,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 220,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay(160),
                ]),
            ),
        );

        loops.forEach((loop) => loop.start());
        return () => {
            loops.forEach((loop) => loop.stop());
        };
    }, [animations]);

    return (
        <View style={styles.typingDots}>
            {animations.map((anim, index) => (
                <Animated.View
                    key={`typing-dot-${index}`}
                    style={[styles.typingDot, { transform: [{ translateY: anim }] }]}
                />
            ))}
        </View>
    );
};

const Chatbot: React.FC = () => {
    const navigation = useNavigation<ChatbotNavigationProp>();
    const route = useRoute<ChatbotRouteProp>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [showWelcome, setShowWelcome] = useState<boolean>(true);
    const [totalMessages, setTotalMessages] = useState<number>(0);
    const [currentLanguage, setCurrentLanguage] = useState<"tr" | "en">("tr");
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

    const scrollViewRef = useRef<ScrollView | null>(null);
    const inputRef = useRef<TextInput | null>(null);
    const welcomeOpacity = useRef(new Animated.Value(0)).current;

    const translation = useMemo(() => translations[currentLanguage], [currentLanguage]);

    useEffect(() => {
        if (showWelcome) {
            welcomeOpacity.setValue(0);
            Animated.timing(welcomeOpacity, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [showWelcome, welcomeOpacity]);

    const scrollToBottom = useCallback(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    useEffect(() => {
        if (route.params?.userId) {
            // You can utilize userId here if needed in the future
        }
    }, [route.params?.userId]);

    const getCurrentTime = useCallback(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }, []);

    const convertBackendResponseToEmotion = useCallback(
        (backendResponse: any): Emotion => {
            const { probs, label_Tr, label_En } = backendResponse ?? {};
            const label = currentLanguage === "tr" ? label_Tr : label_En;
            const labelLower = (label ?? "").toLowerCase();

            let type: Emotion["type"] = "neutral";
            let icon = "😐";

            if (labelLower.includes("pozitif") || labelLower.includes("positive")) {
                type = "positive";
                icon = "😊";
            } else if (labelLower.includes("negatif") || labelLower.includes("negative")) {
                type = "negative";
                icon = "😔";
            }

            const positive = probs?.positive ?? 0;
            const negative = probs?.negative ?? 0;
            const neutral = probs?.neutral ?? 0;
            const maxProb = Math.max(positive, negative, neutral, 0);
            const confidence = Math.round(maxProb * 100);

            let labelText = translation.neutral;
            if (type === "positive") {
                labelText = translation.positive;
            } else if (type === "negative") {
                labelText = translation.negative;
            }

            return {
                type,
                confidence,
                score: maxProb,
                icon,
                label: labelText,
                probs,
            };
        },
        [currentLanguage, translation],
    );

    const analyzeEmotion = useCallback(
        async (text: string): Promise<Emotion> => {
            try {
                setIsAnalyzing(true);
                const response = await fetch(`${API_URL}/api/sentiment/analyze`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                        lang: currentLanguage,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                return convertBackendResponseToEmotion(data);
            } catch (error) {
                console.error("Error analyzing emotion:", error);
                return {
                    type: "neutral",
                    confidence: 0,
                    score: 0,
                    icon: "😐",
                    label: translation.neutral,
                    error: true,
                };
            } finally {
                setIsAnalyzing(false);
            }
        },
        [convertBackendResponseToEmotion, currentLanguage, translation],
    );

    const handleSendMessage = useCallback(async () => {
        const messageText = inputValue.trim();

        if (!messageText || isTyping || isAnalyzing) {
            return;
        }

        if (showWelcome) {
            setShowWelcome(false);
        }

        const userId = route.params?.userId;

        const userMessage: Message = {
            id: Date.now(),
            text: messageText,
            sender: "user",
            time: getCurrentTime(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setTotalMessages((prev) => prev + 1);
        setInputValue("");
        setIsTyping(true);

        try {
            // 🟢 Kullanıcının mesajını backend'e kaydet
            await fetch(`${API_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    text: messageText,
                }),
            });

            // 🧠 Duygu analizi isteği
            const emotion = await analyzeEmotion(messageText);

            const analysisText = `${translation.analysisResult} ${translation.analysisText} ${emotion.label} ${translation.analysisText2} ${translation.confidenceScore} %${emotion.confidence}`;

            const botMessage: Message = {
                id: Date.now() + 1,
                text: analysisText,
                sender: "bot",
                time: getCurrentTime(),
                emotion,
            };

            // 🟢 Bot mesajını da backend'e kaydet
            await fetch(`${API_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    text: analysisText,
                }),
            });

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            const botMessage: Message = {
                id: Date.now() + 1,
                text: translation.errorText,
                sender: "bot",
                time: getCurrentTime(),
            };

            // 🟢 Hata mesajını da kaydet
            await fetch(`${API_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    text: translation.errorText,
                }),
            });

            setMessages((prev) => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    }, [analyzeEmotion, getCurrentTime, inputValue, isAnalyzing, isTyping, showWelcome, translation, route.params?.userId]);


    const changeLanguage = (lang: "tr" | "en") => {
        setCurrentLanguage(lang);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.root}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.avatarWrapper}>
                                <Image source={ogreniyorumIcon} style={styles.avatarImage} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>
                                    {translation.headerTitle} {route.params?.userId ? `(${route.params.userId})` : ""}
                                </Text>
                                <View style={styles.statusRow}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>{translation.statusText}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.languageSwitch}>
                                <TouchableOpacity
                                    style={[
                                        styles.languageButton,
                                        currentLanguage === "tr" && styles.languageButtonActive,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => changeLanguage("tr")}
                                >
                                    <Text
                                        style={[
                                            styles.languageButtonText,
                                            currentLanguage === "tr" && styles.languageButtonTextActive,
                                        ]}
                                    >
                                        🇹🇷 TR
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.languageButton,
                                        currentLanguage === "en" && styles.languageButtonActive,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => changeLanguage("en")}
                                >
                                    <Text
                                        style={[
                                            styles.languageButtonText,
                                            currentLanguage === "en" && styles.languageButtonTextActive,
                                        ]}
                                    >
                                        🇬🇧 EN
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>{translation.statLabel}</Text>
                                <Text style={styles.statValue}>{totalMessages}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Chat Container */}
                <View style={styles.chatContainer}>
                    {showWelcome && (
                        <Animated.View style={[styles.welcomeCard, { opacity: welcomeOpacity }]}>
                            <Text style={styles.welcomeEmoji}>😊</Text>
                            <Text style={styles.welcomeTitle}>{translation.welcomeTitle}</Text>
                            <Text style={styles.welcomeText}>{translation.welcomeText}</Text>
                        </Animated.View>
                    )}

                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesScroll}
                        contentContainerStyle={styles.messagesContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[styles.messageRow, message.sender === "user" ? styles.messageRowUser : styles.messageRowBot]}
                            >
                                {message.sender === "bot" && (
                                    <View style={styles.messageAvatar}>
                                        <Image source={ogreniyorumIcon} style={styles.messageAvatarImage} />
                                    </View>
                                )}
                                <View
                                    style={[
                                        styles.messageBubble,
                                        message.sender === "user" ? styles.messageBubbleUser : styles.messageBubbleBot,
                                    ]}
                                >
                                    <Text style={styles.messageText}>{message.text}</Text>
                                    <Text style={[styles.messageTime, message.sender === "user" && styles.messageTimeUser]}>
                                        {message.time}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {isTyping && (
                            <View style={[styles.messageRow, styles.messageRowBot]}>
                                <View style={styles.messageAvatar}>
                                    <Image source={ogreniyorumIcon} style={styles.messageAvatarImage} />
                                </View>
                                <View style={[styles.messageBubble, styles.messageBubbleBot]}>
                                    <TypingIndicator />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder={translation.placeholder}
                            placeholderTextColor="#7a869a"
                            value={inputValue}
                            onChangeText={setInputValue}
                            editable={!isTyping && !isAnalyzing}
                            multiline
                            numberOfLines={1}
                            returnKeyType="send"
                            onSubmitEditing={handleSendMessage}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputValue.trim() || isTyping || isAnalyzing) && styles.sendButtonDisabled]}
                            activeOpacity={0.85}
                            onPress={handleSendMessage}
                            disabled={!inputValue.trim() || isTyping || isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.sendButtonText}>➤</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#309dff",
    },
    root: {
        flex: 1,
        backgroundColor: "#309dff",
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderBottomWidth: 2,
        borderBottomColor: "rgba(48, 157, 255, 0.12)",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#309dff",
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#309dff",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    avatarImage: {
        width: 40,
        height: 40,
        resizeMode: "contain",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a3353",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#309dff",
        shadowColor: "#309dff",
        shadowOpacity: 0.6,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
    },
    statusText: {
        fontSize: 12,
        color: "#5f6c80",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    languageSwitch: {
        flexDirection: "row",
        backgroundColor: "rgba(48, 157, 255, 0.12)",
        borderRadius: 14,
        padding: 4,
        gap: 6,
    },
    languageButton: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "transparent",
    },
    languageButtonActive: {
        backgroundColor: "#309dff",
        elevation: 2,
        shadowColor: "#309dff",
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    languageButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#63748c",
    },
    languageButtonTextActive: {
        color: "#ffffff",
    },
    statBox: {
        alignItems: "flex-end",
    },
    statLabel: {
        fontSize: 11,
        color: "#9aa5b8",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#309dff",
        marginTop: 2,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: "#f4f7fb",
        //borderTopLeftRadius: 28,
        //borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
    },
    welcomeCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 22,
        paddingVertical: 24,
        paddingHorizontal: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(48, 157, 255, 0.1)",
        shadowColor: "#309dff",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    welcomeEmoji: {
        fontSize: 36,
        marginBottom: 8,
    },
    welcomeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1b1f3b",
        marginBottom: 8,
        textAlign: "center",
    },
    welcomeText: {
        fontSize: 14,
        color: "#5f6c80",
        textAlign: "center",
        lineHeight: 20,
    },
    messagesScroll: {
        flex: 1,
    },
    messagesContent: {
        paddingBottom: 16,
        gap: 18,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 12,
    },
    messageRowUser: {
        justifyContent: "flex-end",
    },
    messageRowBot: {
        justifyContent: "flex-start",
    },
    messageAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#309dff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#309dff",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    messageAvatarImage: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    messageBubble: {
        maxWidth: "75%",
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    messageBubbleUser: {
        backgroundColor: "#309dff",
        borderBottomLeftRadius: 6,
    },
    messageBubbleBot: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "rgba(48, 157, 255, 0.12)",
        borderBottomRightRadius: 6,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
        color: "#1a1a1a",
    },
    messageTime: {
        fontSize: 11,
        marginTop: 8,
        textAlign: "right",
        color: "#6c7a92",
    },
    messageTimeUser: {
        color: "rgba(255,255,255,0.9)",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.08)",
        paddingTop: 12,
    },
    input: {
        flex: 1,
        borderRadius: 22,
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: "rgba(48, 157, 255, 0.2)",
        fontSize: 15,
        minHeight: 48,
        maxHeight: 120,
        color: "#1a3353",
    },
    sendButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#309dff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#309dff",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: 20,
        color: "#ffffff",
        fontWeight: "700",
    },
    typingDots: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#309dff",
    },
});

export default Chatbot;


