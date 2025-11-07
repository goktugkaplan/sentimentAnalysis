import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom"; // ✅ yönlendirme için
import { API_URL } from "../../services/config";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate(); // ✅ yönlendirme hook'u

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!username.trim()) {
            setError("Kullanıcı adı boş olamaz!");
            return;
        }

        try {
            const response = await fetch(`https://sentimentanalysisbackend-y3q9.onrender.com/api/user/register`, {
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

            const data = await response.json();
            console.log("Kayıt başarılı:", data);
            setSuccess("Kayıt başarılı!");

            // ✅ id'yi Chatbot sayfasına gönder
            setTimeout(() => {
                navigate("/chatbot", { state: { userId: data.id } });
            }, 1000);

        } catch (err) {
            setError("Sunucuya bağlanılamadı!");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#309dff",
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: 350,
                    borderRadius: 3,
                    textAlign: "center",
                }}
            >
                <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                    Kayıt Ol
                </Typography>

                <form onSubmit={handleRegister}>
                    <TextField
                        fullWidth
                        label="Kullanıcı Adı"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={!!error && !success}
                        helperText={error && !success ? error : ""}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            borderRadius: 2,
                            backgroundColor: "#309dff",
                            "&:hover": {
                                backgroundColor: "#1f82d1",
                            },
                        }}
                    >
                        Register
                    </Button>

                    {success && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            {success}
                        </Alert>
                    )}
                </form>
            </Paper>
        </Box>
    );
}
