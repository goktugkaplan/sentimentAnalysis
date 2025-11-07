import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    ThemeProvider,
    createTheme,
    Fade,
    Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useLocation } from "react-router-dom";
import { API_URL } from "../services/config";

// Custom theme with #309dff color
const theme = createTheme({
    palette: {
        primary: {
            main: '#309dff',
            dark: '#1e6dd0',
        },
    },
});

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);
    const [currentLanguage, setCurrentLanguage] = useState('tr'); // Default language
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const location = useLocation();
    const userId = location.state?.userId;


    // Language translations
    const translations = {
        tr: {
            headerTitle: 'Duygu Analiz Botu',
            statusText: 'Çevrimiçi • Mesajlarınızı analiz ediyor',
            welcomeTitle: 'Duygu Analiz Botuna Hoş Geldiniz!',
            welcomeText: 'Mesajlarınızı yazın, ben de duygularınızı analiz edeyim. Pozitif, negatif veya nötr duyguları tespit edebilirim.',
            statLabel: 'Analiz Edilen',
            placeholder: 'Duygularınızı paylaşın, analiz edeyim...',
            positive: 'Pozitif',
            negative: 'Negatif',
            neutral: 'Nötr',
            analysisResult: 'Analiz Sonucu:',
            analysisText: 'Mesajınız',
            analysisText2: 'duygu içeriyor.',
            confidenceScore: 'Güven skoru:'
        },
        en: {
            headerTitle: 'Emotion Analysis Bot',
            statusText: 'Online • Analyzing your messages',
            welcomeTitle: 'Welcome to Emotion Analysis Bot!',
            welcomeText: 'Write your messages, and I will analyze your emotions. I can detect positive, negative, or neutral emotions.',
            statLabel: 'Analyzed',
            placeholder: 'Share your feelings, I\'ll analyze them...',
            positive: 'Positive',
            negative: 'Negative',
            neutral: 'Neutral',
            analysisResult: 'Analysis Result:',
            analysisText: 'Your message contains',
            analysisText2: 'emotion.',
            confidenceScore: 'Confidence score:'
        }
    };


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Convert backend response to emotion object
    const convertBackendResponseToEmotion = (backendResponse) => {
        const t = translations[currentLanguage];
        const { probs, label_Tr, label_En } = backendResponse;

        // Determine emotion type from label
        const label = currentLanguage === 'tr' ? label_Tr : label_En;
        const labelLower = label?.toLowerCase() || '';

        let type = 'neutral';
        let icon = '😐';

        if (labelLower.includes('pozitif') || labelLower.includes('positive')) {
            type = 'positive';
            icon = '😊';
        } else if (labelLower.includes('negatif') || labelLower.includes('negative')) {
            type = 'negative';
            icon = '😔';
        }

        // Get the highest probability as confidence
        const maxProb = Math.max(
            probs?.positive || 0,
            probs?.negative || 0,
            probs?.neutral || 0
        );
        const confidence = Math.round(maxProb * 100);

        // Get label text based on current language
        let labelText = t.neutral;
        if (type === 'positive') {
            labelText = t.positive;
        } else if (type === 'negative') {
            labelText = t.negative;
        }

        return {
            type,
            confidence,
            score: maxProb,
            icon,
            label: labelText,
            probs: probs
        };
    };

    // Call backend API to analyze sentiment
    const analyzeEmotion = async (text) => {
        try {
            const response = await fetch(`${API_URL}/api/sentiment/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    lang: currentLanguage
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return convertBackendResponseToEmotion(data);
        } catch (error) {
            console.error('Error analyzing emotion:', error);
            // Fallback to neutral emotion on error
            const t = translations[currentLanguage];
            return {
                type: 'neutral',
                confidence: 0,
                score: 0,
                icon: '😐',
                label: t.neutral,
                error: true
            };
        }
    };


    const changeLanguage = (lang) => {
        setCurrentLanguage(lang);
    };

    const handleSendMessage = async () => {
        const messageText = inputValue.trim();
        if (!messageText || isTyping) return;

        if (showWelcome) setShowWelcome(false);

        // Kullanıcı mesajını ekle
        const userMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'user',
            time: getCurrentTime(),
        };
        setMessages(prev => [...prev, userMessage]);
        setTotalMessages(prev => prev + 1);
        setInputValue('');
        setIsTyping(true);

        try {
            // 1️⃣ Kullanıcı mesajını backend'e kaydet
            await fetch(`${API_URL}/api/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, text: messageText }),
            });

            // 2️⃣ Duygu analizi yap
            const emotion = await analyzeEmotion(messageText);
            const analysisText = `${translations[currentLanguage].analysisResult} ${translations[currentLanguage].analysisText} ${emotion.label} ${translations[currentLanguage].analysisText2} ${translations[currentLanguage].confidenceScore} %${emotion.confidence}`;

            const botMessage = {
                id: Date.now() + 1,
                text: analysisText,
                sender: 'bot',
                time: getCurrentTime(),
                emotion: emotion
            };

            // 3️⃣ Bot mesajını frontend'e ekle
            setMessages(prev => [...prev, botMessage]);

            // 4️⃣ Bot mesajını backend'e kaydet
            await fetch(`${API_URL}/api/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, text: analysisText }),
            });

        } catch (error) {
            console.error('Error sending message or analyzing emotion:', error);
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };



    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    width: '100%',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #309dff 0%, #1e6dd0 100%)',
                }}
            >
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        padding: '20px 30px',
                        boxShadow: '0 4px 20px rgba(48, 157, 255, 0.2)',
                        borderBottom: '2px solid rgba(48, 157, 255, 0.1)',
                        borderRadius: 0,
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: '1200px',
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                                sx={{
                                    width: 50,
                                    height: 50,
                                    background: 'linear-gradient(135deg, #309dff, #1e6dd0)',
                                    boxShadow: '0 4px 12px rgba(48, 157, 255, 0.4)',
                                }}
                            >
                                <img
                                    src="/images/bot.png"
                                    alt="Ogreniyorum Icon"
                                    style={{ width: '70%', height: '70%', objectFit: 'contain', padding: '8px' }}
                                />
                            </Avatar>
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        background: 'linear-gradient(135deg, #309dff, #1e6dd0)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        margin: 0,
                                    }}
                                >
                                    {translations[currentLanguage].headerTitle} Kullanıcı ID: {userId}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: '#309dff',
                                            boxShadow: '0 0 8px rgba(48, 157, 255, 0.6)',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: '#666', fontSize: '13px' }}>
                                        {translations[currentLanguage].statusText}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                width: { xs: '100%', sm: 'auto' },
                                justifyContent: { xs: 'space-between', sm: 'flex-end' },
                                order: { xs: -1, sm: 0 },
                            }}
                        >
                            {/* Language Selector */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    background: 'rgba(48, 157, 255, 0.1)',
                                    padding: '4px',
                                    borderRadius: '12px',
                                }}
                            >
                                <Button
                                    onClick={() => changeLanguage('tr')}
                                    variant={currentLanguage === 'tr' ? 'contained' : 'text'}
                                    sx={{
                                        minWidth: 'auto',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        background: currentLanguage === 'tr' ? 'linear-gradient(135deg, #309dff, #1e6dd0)' : 'transparent',
                                        color: currentLanguage === 'tr' ? 'white' : '#666',
                                        boxShadow: currentLanguage === 'tr' ? '0 2px 8px rgba(48, 157, 255, 0.3)' : 'none',
                                        '&:hover': {
                                            background: currentLanguage === 'tr' ? 'linear-gradient(135deg, #1e6dd0, #309dff)' : 'rgba(48, 157, 255, 0.15)',
                                        },
                                    }}
                                >
                                    TR
                                </Button>
                                <Button
                                    onClick={() => changeLanguage('en')}
                                    variant={currentLanguage === 'en' ? 'contained' : 'text'}
                                    sx={{
                                        minWidth: 'auto',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        background: currentLanguage === 'en' ? 'linear-gradient(135deg, #309dff, #1e6dd0)' : 'transparent',
                                        color: currentLanguage === 'en' ? 'white' : '#666',
                                        boxShadow: currentLanguage === 'en' ? '0 2px 8px rgba(48, 157, 255, 0.3)' : 'none',
                                        '&:hover': {
                                            background: currentLanguage === 'en' ? 'linear-gradient(135deg, #1e6dd0, #309dff)' : 'rgba(48, 157, 255, 0.15)',
                                        },
                                    }}
                                >
                                    EN
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '11px',
                                        color: '#999',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {translations[currentLanguage].statLabel}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#309dff',
                                        marginTop: '2px',
                                    }}
                                >
                                    {totalMessages}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Chat Container */}
                <Box
                    sx={{
                        flex: 1,
                        maxWidth: '1200px',
                        width: '100%',
                        margin: '0 auto',
                        backgroundColor: '#f5f7fa',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100vh - 120px)',
                        padding: '30px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Welcome Message */}
                    {showWelcome && (
                        <Fade in={showWelcome}>
                            <Paper
                                elevation={0}
                                sx={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    background: 'white',
                                    borderRadius: '20px',
                                    marginBottom: '20px',
                                    boxShadow: '0 4px 15px rgba(48, 157, 255, 0.1)',
                                    border: '2px solid rgba(48, 157, 255, 0.1)',
                                }}
                            >
                                <Typography variant="h3" sx={{ marginBottom: 2 }}>
                                    😊
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        marginBottom: 1,
                                    }}
                                >
                                    {translations[currentLanguage].welcomeTitle}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#666',
                                        lineHeight: 1.6,
                                        maxWidth: '500px',
                                        margin: '0 auto',
                                    }}
                                >
                                    {translations[currentLanguage].welcomeText}
                                </Typography>
                            </Paper>
                        </Fade>
                    )}

                    {/* Messages */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            overflowY: 'auto',
                            flex: 1,
                            padding: '20px 0',
                            paddingRight: '10px',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(0, 0, 0, 0.05)',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '4px',
                                '&:hover': {
                                    background: 'rgba(0, 0, 0, 0.3)',
                                },
                            },
                        }}
                    >
                        {messages.map((message) => (
                            <Fade key={message.id} in={true}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        gap: 1,
                                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {message.sender === 'bot' && (
                                        <Avatar
                                            sx={{
                                                width: 45,
                                                height: 45,
                                                background: 'linear-gradient(135deg, #309dff, #1e6dd0)',
                                                boxShadow: '0 4px 12px rgba(48, 157, 255, 0.4)',
                                            }}
                                        >
                                            <img
                                                src="/images/bot.png"
                                                alt="Ogreniyorum Icon"
                                                style={{ width: '70%', height: '70%', objectFit: 'contain', padding: '6px' }}
                                            />
                                        </Avatar>
                                    )}
                                    <Box
                                        sx={{
                                            maxWidth: '65%',
                                            padding: '14px 18px',
                                            borderRadius: '20px',
                                            background:
                                                message.sender === 'user'
                                                    ? 'linear-gradient(135deg, #309dff, #1e6dd0)'
                                                    : 'white',
                                            color: message.sender === 'user' ? 'white' : '#333',
                                            borderBottomLeftRadius: message.sender === 'user' ? '4px' : '20px',
                                            borderBottomRightRadius: message.sender === 'user' ? '20px' : '4px',
                                            boxShadow:
                                                message.sender === 'user'
                                                    ? '0 4px 12px rgba(48, 157, 255, 0.3)'
                                                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                            border:
                                                message.sender === 'bot'
                                                    ? '1px solid rgba(48, 157, 255, 0.1)'
                                                    : 'none',
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontSize: '15px',
                                                lineHeight: 1.5,
                                                marginBottom: 1,
                                            }}
                                        >
                                            {message.text}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '12px',
                                                opacity: 0.85,
                                                textAlign: 'right',
                                                marginTop: 1,
                                                display: 'block',
                                                color: message.sender === 'user' ? 'rgba(255, 255, 255, 0.9)' : '#666',
                                            }}
                                        >
                                            {message.time}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Fade>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 45,
                                        height: 45,
                                        background: 'linear-gradient(135deg, #309dff, #1e6dd0)',
                                        boxShadow: '0 4px 12px rgba(48, 157, 255, 0.4)',
                                    }}
                                >
                                    <img
                                        src="/images/bot.png"
                                        alt="Ogreniyorum Icon"
                                        style={{ width: '70%', height: '70%', objectFit: 'contain', padding: '6px' }}
                                    />
                                </Avatar>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        padding: '12px 16px',
                                        borderRadius: '20px',
                                        borderBottomRightRadius: '4px',
                                        background: 'white',
                                        border: '1px solid rgba(48, 157, 255, 0.1)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {[0, 1, 2].map((index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: '#309dff',
                                                    opacity: 0.7,
                                                    animation: 'typing 1.4s infinite',
                                                    animationDelay: `${index * 0.2}s`,
                                                    '@keyframes typing': {
                                                        '0%, 60%, 100%': {
                                                            transform: 'translateY(0)',
                                                            opacity: 0.7,
                                                        },
                                                        '30%': {
                                                            transform: 'translateY(-10px)',
                                                            opacity: 1,
                                                        },
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Container */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            padding: '20px 0 0 0',
                            marginTop: 2.5,
                            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            placeholder={translations[currentLanguage].placeholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isTyping}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '28px',
                                    background: 'white',
                                    border: '2px solid rgba(48, 157, 255, 0.2)',
                                    '&:hover': {
                                        borderColor: 'rgba(48, 157, 255, 0.4)',
                                    },
                                    '&.Mui-focused': {
                                        borderColor: '#309dff',
                                        boxShadow: '0 4px 15px rgba(48, 157, 255, 0.2)',
                                    },
                                    '& fieldset': {
                                        border: 'none',
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    padding: '16px 20px',
                                    fontSize: '15px',
                                },
                            }}
                        />
                        <IconButton
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isTyping}
                            sx={{
                                width: 52,
                                height: 52,
                                background: 'linear-gradient(135deg, #309dff, #1e6dd0)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(48, 157, 255, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #1e6dd0, #309dff)',
                                    transform: 'scale(1.08)',
                                    boxShadow: '0 6px 18px rgba(48, 157, 255, 0.5)',
                                },
                                '&:active': {
                                    transform: 'scale(0.96)',
                                },
                                '&.Mui-disabled': {
                                    opacity: 0.5,
                                    transform: 'none',
                                },
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default Chatbot;

