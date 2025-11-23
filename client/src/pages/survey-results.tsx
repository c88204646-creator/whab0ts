import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Survey, SurveyQuestion, SurveyResponse } from "@shared/schema";
import { BarChart3, Users } from "lucide-react";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function SurveyResultsPage() {
  const [match, params] = useRoute("/survey/:id/results");
  const surveyId = params?.id;

  const { data: survey, isLoading: surveyLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<SurveyQuestion[]>({
    queryKey: [`/api/survey-questions/${surveyId}`],
    enabled: !!surveyId,
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<SurveyResponse[]>({
    queryKey: [`/api/survey-responses/${surveyId}`],
    enabled: !!surveyId,
  });

  if (surveyLoading || questionsLoading || responsesLoading) {
    return <LoadingSpinner />;
  }

  if (!survey) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-foreground">Encuesta no encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">La encuesta que buscas no existe o ha sido eliminada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique respondents
  const uniqueRespondents = new Set(responses.map(r => r.respondentName || r.id)).size;

  // Calculate response distribution
  const getResponsesForQuestion = (questionId: string) => {
    return responses.filter(r => {
      try {
        const answers = JSON.parse(r.answers);
        return answers[questionId];
      } catch {
        return false;
      }
    });
  };

  const getAnswerCount = (questionId: string, answer: string) => {
    return getResponsesForQuestion(questionId).filter(r => {
      try {
        const answers = JSON.parse(r.answers);
        return answers[questionId] === answer;
      } catch {
        return false;
      }
    }).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{survey.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Respuestas" value={responses.length} icon={Users} />
              <StatCard label="Preguntas" value={questions.length} icon={BarChart3} />
              <StatCard label="Respondentes" value={uniqueRespondents} icon={Users} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {questions.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">Sin preguntas</p>
                <p className="text-sm text-muted-foreground mt-2">Esta encuesta aún no tiene preguntas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {questions.map((question, idx) => {
                const questionResponses = getResponsesForQuestion(question.id);
                const responseCount = questionResponses.length;
                const percentage = responses.length > 0 ? (responseCount / responses.length) * 100 : 0;

                // Parse options
                let options: string[] = [];
                try {
                  options = question.options ? JSON.parse(question.options) : [];
                } catch {
                  options = [];
                }

                return (
                  <Card key={question.id} data-testid={`card-question-${question.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {idx + 1}. {question.text}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-2">
                            {responseCount} de {responses.length} respondieron
                            {responses.length > 0 && ` (${percentage.toFixed(1)}%)`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {question.type === "text" ? (
                        <div className="space-y-2">
                          {questionResponses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin respuestas</p>
                          ) : (
                            questionResponses.map((resp, i) => {
                              try {
                                const answers = JSON.parse(resp.answers);
                                return (
                                  <div
                                    key={i}
                                    className="p-3 bg-muted/30 rounded-lg border border-border/50"
                                    data-testid={`text-response-${i}`}
                                  >
                                    <p className="text-sm text-foreground">{answers[question.id]}</p>
                                    {resp.respondentName && (
                                      <p className="text-xs text-muted-foreground mt-1">- {resp.respondentName}</p>
                                    )}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })
                          )}
                        </div>
                      ) : question.type === "textarea" ? (
                        <div className="space-y-2">
                          {questionResponses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin respuestas</p>
                          ) : (
                            questionResponses.map((resp, i) => {
                              try {
                                const answers = JSON.parse(resp.answers);
                                return (
                                  <div
                                    key={i}
                                    className="p-3 bg-muted/30 rounded-lg border border-border/50"
                                    data-testid={`textarea-response-${i}`}
                                  >
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{answers[question.id]}</p>
                                    {resp.respondentName && (
                                      <p className="text-xs text-muted-foreground mt-1">- {resp.respondentName}</p>
                                    )}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })
                          )}
                        </div>
                      ) : options.length > 0 ? (
                        <div className="space-y-2">
                          {options.map((option) => {
                            const count = getAnswerCount(question.id, option);
                            const optionPercentage = responseCount > 0 ? (count / responseCount) * 100 : 0;
                            return (
                              <div key={option} className="space-y-1" data-testid={`option-${option}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-foreground">{option}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {count} ({optionPercentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${optionPercentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin opciones configuradas</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
