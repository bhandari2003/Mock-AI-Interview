"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import db from "@/utils/db"; // Ensure this import is correct
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

const RecordAnswerSection = ({
    mockInterviewQuestion,
    activeQuestionIndex,
    interviewData,
}) => {
    const [userAnswer, setUserAnswer] = useState("");
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const {
        error,
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
        setResults,
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false,
    });

    useEffect(() => {
        results.map((result) =>
            setUserAnswer((prevAns) => prevAns + result?.transcript)
        );
    }, [results]);

    useEffect(() => {
        if (!isRecording && userAnswer.length > 10) {
            updateUserAnswer();
        }
    }, [userAnswer]);

    const startStopRecording = async () => {
        if (isRecording) {
            stopSpeechToText();
        } else {
            startSpeechToText();
        }
    };

    const updateUserAnswer = async () => {
        console.log("User Answer:", userAnswer);
        setLoading(true);

        if (!interviewData || !interviewData.mockId) {
            console.error("Invalid interview data:", interviewData);
            toast.error("Failed to save user answer: Invalid interview data");
            setLoading(false);
            return;
        }

        const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}, User Answer: ${userAnswer}, Depends on question and user answer for given interview question, please give us rating for answer and feedback as area of improvement if any in just 3 to 5 lines to improve it in JSON format with rating field and feedback field`;

        try {
            const result = await chatSession.sendMessage(feedbackPrompt);
            const mockJsonResp = (await result.response.text()).replace('```json', '').replace('```', '');
            console.log("Feedback Response:", mockJsonResp);
            const jsonFeedbackResp = JSON.parse(mockJsonResp);

            const resp = await db.insert(UserAnswer).values({
                mockIdRef: interviewData.mockId,
                question: mockInterviewQuestion[activeQuestionIndex]?.question,
                correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                userAns: userAnswer,
                feedback: jsonFeedbackResp?.feedback,
                rating: jsonFeedbackResp?.rating,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                createdAt: moment().format("DD-MM-YYYY"),
            });

            if (resp) {
                toast.success("User answer recorded successfully");
                setUserAnswer("");
                setResults([]);
            }
        } catch (error) {
            console.error("Error saving user answer:", error);
            toast.error("Failed to save user answer");
        } finally {
            setLoading(false);
        }
    };

    if (error) return <p>Web Speech API is not available in this browser 🤷‍</p>;
    return (
        <div className="flex items-center justify-center flex-col">
            <div className="flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5 ">
                <Image src={"/webcam.png"} width={200} height={200} className=" absolute" />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 300,
                        width: "100%",
                        zIndex: 10,
                    }}
                />
            </div>
            <Button
                disabled={loading}
                variant="outline"
                className="my-10"
                onClick={startStopRecording}
            >
                {isRecording ? (
                    <div className="flex gap-2 items-center">
                        <StopCircle className="text-red-600" />
                        <span>Stop Recording</span>
                    </div>
                ) : (
                    <div className="flex gap-2 items-center">
                        <Mic />
                        <span>Record Answer</span>
                    </div>
                )}
            </Button>
            {/* <Button onClick={() => console.log(userAnswer)}>Show User Answer</Button> */}
        </div>
    );
};

export default RecordAnswerSection;
