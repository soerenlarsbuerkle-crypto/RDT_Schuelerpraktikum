"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

// Die Typen in diesem Abschnitt beschreiben die Daten, die das Quiz im Browser verwendet.
// Dadurch erkennt TypeScript Tippfehler frühzeitig und macht die Struktur der Daten sichtbar.
type QuizId = string;
type QuestionKind = "multiple-choice" | "text" | "number" | "true-false";
type Answer = { text: string; correct: boolean };
type MultipleChoiceQuestion = { id: string; kind: Extract<QuestionKind, "multiple-choice">; question: string; questionEn?: string; answers: Answer[]; answersEn?: Answer[] };
type TextQuestion = { id: string; kind: Extract<QuestionKind, "text">; question: string; questionEn?: string; placeholder: string; expectedAnswers: string[]; expectedAnswersEn?: string[]; feedbackAnswer: string; feedbackAnswerEn?: string };
type NumberQuestion = { id: string; kind: Extract<QuestionKind, "number">; question: string; questionEn?: string; placeholder: string; expectedNumber: number; unit: string; unitEn?: string; feedbackAnswer: string };
type TrueFalseQuestion = { id: string; kind: Extract<QuestionKind, "true-false">; question: string; questionEn?: string; expectedBoolean: boolean };
type Question = MultipleChoiceQuestion | TextQuestion | NumberQuestion | TrueFalseQuestion;
type Rating = { username: string; stars: number; comment: string; createdAt: string; updatedAt: string };
type QuizRatingSummary = { ratingAverage: number; ratingCount: number; ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> };
type QuizDefinition = { id: QuizId; title: string; titleEn?: string; description: string; descriptionEn?: string; questions: Question[]; isSystem?: boolean; questionCount?: number; createdAt?: string; ratingAverage?: number; ratingCount?: number; ratingDistribution?: Record<1 | 2 | 3 | 4 | 5, number> };
type User = { id: number; username: string; publicId: string; role: "user" | "admin" };
type AdminUser = { id: number; username: string; publicId: string; role: "user" | "admin"; bestCorrect: number | null; bestTotal: number | null; bestElapsedMs: number | null; bestCompletedAt: string | null; attempts: number };
type QuizResult = { id: number; username: string; publicId: string; quizId: QuizId; correct: number; total: number; elapsedMs: number; percentage: number; completedAt: string; attempts?: number; attemptNumber?: number; rank?: number | null };
type DraftQuestion = { kind: QuestionKind; question: string; questionEn: string; answers: string[]; answersEn: string[]; correctIndex: number; expectedAnswer: string; expectedAnswerEn: string; expectedNumber: string; unit: string; unitEn: string; expectedBoolean: boolean };
type Feedback = { correct: boolean; expected: string };
type Language = "de" | "en";

// Übersetzungstabelle: Deutsch ist die Ausgangssprache, Englisch enthält die abweichenden Texte.
// Alle sichtbaren Texte werden später über t(...) aus dieser Tabelle gelesen.
const translations: Record<Language, Record<string, string>> = {
  de: {},
  en: {
    "Rangliste": "Leaderboard", "Wissenstest": "Knowledge quiz", "Serverseitig gespeichert": "Saved on server", "Meine Ergebnisse": "My results", "Alle Ergebnisse": "All results", "Global": "Global", "Zurück zum Dashboard": "Back to dashboard", "Noch keine eigenen Ergebnisse vorhanden.": "No own results yet.", "Noch keine Ergebnisse für dieses Quiz vorhanden.": "No results for this quiz yet.", "Anmelden": "Log in", "Registrieren": "Register", "Benutzername": "Username", "Passwort": "Password", "Dein Passwort": "Your password", "Bitte warten …": "Please wait …", "Passwort zurücksetzen": "Reset password", "E-Mail-Adresse": "Email address", "E-Mail-Adresse eingeben": "Enter your email address", "Zurücksetzungslink senden": "Send reset link", "Neues Passwort": "New password", "Neues Passwort setzen": "Set new password", "Passwort ändern": "Change password", "Ein Link zum Zurücksetzen wurde versendet.": "A reset link has been sent.", "Das Passwort wurde erfolgreich zurückgesetzt.": "Your password was reset successfully.", "Der Zurücksetzungs-Token ist ungültig oder abgelaufen.": "The reset token is invalid or expired.", "Sprache": "Language", "Deutsch": "German", "Englisch": "English", "Verbergen": "Hide", "Anzeigen": "Show", "Maximal 25 Zeichen": "Maximum 25 characters", "Deine Antwort": "Your answer", "Zahl eingeben": "Enter a number", "Quizze": "Quizzes", "Abmelden": "Log out", "Mit dem Handy scannen und anmelden.": "Scan with your phone to log in.", "Entdecke Roche und lerne die Organisation, ihre Forschung und ihre Arbeitsweise kennen.": "Discover Roche, its research, and how it works.", "Zum Dashboard": "To dashboard", "Zur Startseite": "To home", "Quiz in der Rangliste suchen": "Search leaderboard quizzes", "Quiz nach Titel oder Beschreibung suchen …": "Search by quiz title or description …", "Löschen": "Clear", "Quiz-Sortierung": "Quiz sorting", "Sortierung": "Sorting", "Neueste": "Newest", "Alphabetisch": "Alphabetical", "Keine passenden Quizze gefunden.": "No matching quizzes found.", "Desktop verbinden": "Connect desktop", "Anmelden mit dem Handy": "Log in with your phone", "Melde dich an oder registriere dich. Danach wird der Computer, von dem du den QR-Code gescannt hast, automatisch angemeldet.": "Log in or register. The computer where you scanned the QR code will then be logged in automatically.", "Mindestens 12 Zeichen, Zahl, Groß-/Kleinbuchstabe und Sonderzeichen.": "At least 12 characters, a number, upper/lowercase letters, and a special character.", "Anmelden und verbinden": "Log in and connect", "Registrieren und verbinden": "Register and connect", "Desktop verbunden": "Desktop connected", "Du bist auf dem Computer jetzt angemeldet. Dieses Fenster kann geschlossen werden.": "You are now logged in on the computer. This window can be closed.", "Dein Roche-Dashboard": "Your Roche dashboard", "Wähle ein Quiz aus und entdecke Roche in deinem eigenen Tempo.": "Choose a quiz and discover Roche at your own pace.", "Deine Nutzer-ID:": "Your user ID:", "Quizkarten ausblenden": "Hide quiz cards", "Quizkarten anzeigen": "Show quiz cards", "Quizkarten einblenden": "Show quiz cards", "Quizze sichtbar": "quizzes visible", "Quizkarten ausgeblendet": "Quiz cards hidden", "Bestehendes Quiz": "Existing quiz", "Eigenes Quiz": "Custom quiz", "Noch keine Bewertungen": "No ratings yet", "Dein bester Stand:": "Your best score:", "Noch kein Ergebnis": "No result yet", "Abgeschlossen:": "Completed:", "Durchläufe": "attempts", "Nochmal spielen": "Play again", "Quiz starten": "Start quiz", "Adminbereich öffnen": "Open admin area", "Account löschen": "Delete account", "Adminbereich": "Admin area", "Suche Nutzername/ID": "Search username/ID", "Suchen …": "Search …", "Suchen": "Search", "Adminbereich schließen": "Close admin area", "Neues Quiz erstellen": "Create new quiz", "Nutzerverwaltung": "User management", "Keine passenden Nutzer gefunden.": "No matching users found.", "Zum Nutzer machen": "Make user", "Zum Admin machen": "Make admin", "Quizverwaltung": "Quiz management", "System": "System", "Fragen": "questions", "Bearbeiten": "Edit", "Rangliste exportieren": "Export leaderboard", "Quiz aus XLSX importieren": "Import quiz from XLSX", "Exportiert …": "Exporting …", "Importiert …": "Importing …", "Importieren": "Import", "Benutzer": "Users", "Bewertung aktualisieren": "Update rating", "Bewertung speichern": "Save rating", "Speichert …": "Saving …", "Quiz speichern": "Save quiz", "Hallo,": "Hello,", "abgeschlossen": "completed", "aus": "from", "Sterne": "stars", "Zeichen": "characters", "Optionaler Kommentar": "Optional comment", "richtige Antworten": "correct answers", "Danke,": "Thank you,", "Zeit:": "Time:", "Dein Rang:": "Your rank:", "Platz": "place", "Quiz bewerten": "Rate quiz", "Durchschnitt:": "Average:", "Bewertungen": "ratings", "Bewertung von 1 bis 5 Sternen": "Rating from 1 to 5 stars", "Nochmal starten": "Restart", "Deine nächste Frage": "Your next question", "Vergangene Zeit": "Elapsed time", "Zeit": "Time", "Screenrecording zur Gründung von Roche": "Screen recording about Roche's founding", "Dein Browser unterstützt dieses Videoformat nicht.": "Your browser does not support this video format.", "Antwortmöglichkeiten": "Answer options", "Wahr": "True", "Falsch": "False", "Prüfen": "Check", "Richtig!": "Correct!", "Noch nicht richtig.": "Not correct yet.", "Richtige Antwort:": "Correct answer:", "Ergebnis anzeigen": "Show result", "Weiter": "Next", "Prüfe dein Feedback und fahre dann fort.": "Check your feedback and continue.", "Wähle eine Antwort aus.": "Choose an answer.", "Wähle Wahr oder Falsch aus.": "Choose true or false.", "Gib deine Antwort ein und prüfe sie.": "Enter your answer and check it.", "Vorherige Frage": "Previous question", "Sound ausschalten": "Turn sound off", "Sound einschalten": "Turn sound on", "Light mode aktivieren": "Activate light mode", "Dark mode aktivieren": "Activate dark mode", "Sound": "Sound", "Light mode": "Light mode", "Night mode": "Night mode", "Ergebnis konnte nicht gespeichert werden.": "The result could not be saved.", "Server ist momentan nicht erreichbar.": "The server is currently unavailable.", "Der Benutzername muss 1 bis 25 Zeichen lang sein.": "The username must be 1 to 25 characters long.", "Bitte gib dein Passwort ein.": "Please enter your password.", "Bitte gib eine gültige E-Mail-Adresse ein.": "Please enter a valid email address.", "Die Anmeldung ist fehlgeschlagen.": "Log in failed.", "Die Anmeldung konnte nicht abgeschlossen werden.": "Log in could not be completed.", "Der Account konnte nicht gelöscht werden.": "The account could not be deleted.", "Die Admin-Daten konnten nicht geladen werden.": "Admin data could not be loaded.", "Der Benutzer konnte nicht gelöscht werden.": "The user could not be deleted.", "Die Rolle konnte nicht geändert werden.": "The role could not be changed.", "Die Bewertungen konnten nicht geladen werden.": "Ratings could not be loaded.", "Die Bewertung konnte nicht gespeichert werden.": "The rating could not be saved.", "Möchtest du deinen Account wirklich löschen? Deine Highscore-Daten werden ebenfalls entfernt.": "Do you really want to delete your account? Your high-score data will also be removed.", "Diesen Benutzer wirklich löschen?": "Really delete this user?", "Keine Ergebnisse für dieses Quiz vorhanden.": "No results for this quiz yet.", "Versuch": "Attempt", "Versuche": "Attempts", "Quiz wirklich löschen": "Really delete quiz", "Highscores werden ebenfalls entfernt.": "High scores will also be removed.", "Bitte wähle eine XLSX-Datei aus.": "Please choose an XLSX file.", "Bitte gib Titel, Beschreibung und mindestens eine Frage ein.": "Please enter a title, description, and at least one question.", "Bitte wähle 1 bis 5 Sterne. Der Kommentar darf höchstens 500 Zeichen lang sein.": "Please choose 1 to 5 stars. The comment may contain up to 500 characters.", "DIAGNOSTICS & PHARMA": "DIAGNOSTICS & PHARMA", "Nutzername oder Nutzer-ID in der Rangliste suchen": "Search username or user ID in leaderboard", "Nutzername oder Nutzer-ID suchen …": "Search username or user ID …", "QR-Code wird vorbereitet …": "Preparing QR code …", "Quizze im Dashboard suchen": "Search dashboard quizzes", "Admin machen": "Make admin", "Administratoren": "Administrators", "Adminrechte entziehen": "Revoke admin rights", "Multiple Choice": "Multiple choice", "Lückentext": "Cloze text", "Zahleneingabe": "Number input", "Wahr/Falsch": "True/false", "Richtig: Wahr": "Correct: True", "Richtig: Falsch": "Correct: False", "Frage entfernen": "Remove question", "Frage hinzufügen": "Add question", "Abbrechen": "Cancel", "Wähle ein Quiz und lade die globale Rangliste als XLSX oder PDF herunter. Enthalten sind Name, Versuche, Zeit, richtige Antworten und Prozent.": "Choose a quiz and download the global leaderboard as XLSX or PDF. It includes name, attempts, time, correct answers, and percentage.", "Informationen zum Ranglistenexport": "Leaderboard export information", "Die Datei braucht die Blätter Quiz und Fragen. Fragen-Spalten: Typ, Frage, Antwort A-D, Richtige Antwort, Erwartete Antwort, Erwartete Zahl, Einheit.": "The file needs the Quiz and Questions sheets. Question columns: Type, Question, Answers A-D, Correct answer, Expected answer, Expected number, Unit.", "Informationen zum XLSX-Import": "XLSX import information", "Tabellenblätter „Quiz“ und „Fragen“ mit den Spalten Typ, Frage, Antwort A-D, Richtige Antwort, Erwartete Antwort, Erwartete Zahl, Einheit.": "Sheets \"Quiz\" and \"Questions\" with the columns Type, Question, Answers A-D, Correct answer, Expected answer, Expected number, Unit.", "Quizbewertung": "Quiz rating", "Wahr oder Falsch": "True or false", "Antwort eingeben": "Enter answer", "Fragen richtig": "questions correct", "von": "of", "Dashboard": "Dashboard", "Einheit, z. B. Tage": "Unit, e.g. days", "Titel": "Title", "Beschreibung": "Description", "Fragetext": "Question text", "Erwartete Antwort": "Expected answer", "Erwartete Zahl": "Expected number", "Zu Nutzer machen": "Make user", "du": "you", "Quiz bearbeiten": "Edit quiz", "Frage": "Question", "Antwort": "Answer", "Englischer Titel": "English title", "Englische Beschreibung": "English description", "Englischer Fragetext": "English question text", "Englische Antwort": "English answer", "Englische erwartete Antwort": "English expected answer", "Englische Einheit": "English unit", "Passwort verbergen": "Hide password", "Passwort anzeigen": "Show password", "Gültig bis": "Valid until", "Rangliste öffnen": "Open leaderboard", "Roche Wissenstest": "Roche knowledge quiz", "QR-Code zur Anmeldung mit dem Handy": "QR code for logging in with your phone", "Die Rangliste konnte nicht geladen werden.": "The leaderboard could not be loaded.", "Das Quiz konnte nicht gelöscht werden.": "The quiz could not be deleted.", "Der Export konnte nicht erstellt werden.": "The export could not be created.", "Das Quiz konnte nicht importiert werden.": "The quiz could not be imported.", "Das Quiz konnte nicht gespeichert werden.": "The quiz could not be saved.", "Bewertungen konnten nicht geladen werden.": "Ratings could not be loaded.",
  },
};

// Liefert den übersetzten Text; fehlt ein Eintrag, bleibt der ursprüngliche Text erhalten.
function translate(value: string, language: Language): string {
  return translations[language][value] ?? value;
}

// Erstellt eine gemischte Kopie eines Arrays, ohne das ursprüngliche Array zu verändern.
function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

// Mischt Fragen und Antwortmöglichkeiten für einen neuen Quiz-Durchlauf.
// Bei quiz1 bleibt die erste Frage bewusst an ihrer Position, weil dort das Einführungsvideo erscheint.
function createQuiz(quiz: QuizDefinition): Question[] {
  const source = quiz.questions;
  const ordered = quiz.id === "quiz1" ? [source[0], ...shuffle(source.slice(1))] : shuffle(source);
  return ordered.map((question) => question.kind === "multiple-choice" ? { ...question, answers: shuffle(question.answers) } : { ...question });
}

// Wandelt Millisekunden in das sichtbare Format Minuten:Sekunden um.
function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Vereinheitlicht Texteingaben, damit Groß-/Kleinschreibung und Satzzeichen nicht stören.
function normalizeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase("de-DE").replace(/[.,!?]/g, "");
}

// Erstellt die leere Vorlage, die im Quiz-Editor für eine neue Frage verwendet wird.
function emptyDraftQuestion(): DraftQuestion {
  return { kind: "multiple-choice", question: "", questionEn: "", answers: ["", "", "", ""], answersEn: ["", "", "", ""], correctIndex: 0, expectedAnswer: "", expectedAnswerEn: "", expectedNumber: "", unit: "", unitEn: "", expectedBoolean: true };
}

// Ergänzt optionale Serverfelder um sichere Standardwerte für die Oberfläche.
function mergeQuizCatalog(serverQuizzes: QuizDefinition[]): QuizDefinition[] {
  return serverQuizzes.map((quiz) => ({ ...quiz, isSystem: Boolean(quiz.isSystem), questions: quiz.questions ?? [] }));
}

// Lädt die Quizliste vom Server und bricht bei einer fehlgeschlagenen Antwort mit einem Fehler ab.
async function fetchQuizCatalog(language: Language = "de"): Promise<QuizDefinition[]> {
  const response = await fetch(`/api/quizzes?lang=${language}`);
  const data = await response.json() as { quizzes?: QuizDefinition[] };
  if (!response.ok) throw new Error("QUIZ_CATALOG_FAILED");
  return mergeQuizCatalog(data.quizzes ?? []);
}

// Überführt eine gespeicherte Frage in das einheitliche Format des Quiz-Editors.
// Je nach Fragetyp werden nur die jeweils benötigten Felder befüllt.
function draftFromQuestion(question: Question): DraftQuestion {
  if (question.kind === "true-false") {
    return { kind: question.kind, question: question.question, questionEn: question.questionEn ?? "", answers: ["", "", "", ""], answersEn: ["", "", "", ""], correctIndex: 0, expectedAnswer: "", expectedAnswerEn: "", expectedNumber: "", unit: "", unitEn: "", expectedBoolean: question.expectedBoolean };
  }
  if (question.kind === "multiple-choice") {
    return { kind: question.kind, question: question.question, questionEn: question.questionEn ?? "", answers: question.answers.map((answer) => answer.text), answersEn: question.answersEn?.map((answer) => answer.text) ?? ["", "", "", ""], correctIndex: Math.max(0, question.answers.findIndex((answer) => answer.correct)), expectedAnswer: "", expectedAnswerEn: "", expectedNumber: "", unit: "", unitEn: "", expectedBoolean: true };
  }
  if (question.kind === "text") {
    return { kind: question.kind, question: question.question, questionEn: question.questionEn ?? "", answers: ["", "", "", ""], answersEn: ["", "", "", ""], correctIndex: 0, expectedAnswer: question.expectedAnswers[0] ?? "", expectedAnswerEn: question.expectedAnswersEn?.[0] ?? "", expectedNumber: "", unit: "", unitEn: "", expectedBoolean: true };
  }
  return { kind: question.kind, question: question.question, questionEn: question.questionEn ?? "", answers: ["", "", "", ""], answersEn: ["", "", "", ""], correctIndex: 0, expectedAnswer: "", expectedAnswerEn: "", expectedNumber: String(question.expectedNumber), unit: question.unit, unitEn: question.unitEn ?? "", expectedBoolean: true };
}

// Hauptkomponente der Seite: Sie steuert Anmeldung, Dashboard, Quiz, Rangliste und Adminfunktionen.
export default function Home() {
  // Sprach- und Anmeldedaten werden im lokalen React-Zustand gehalten.
  const [language, setLanguage] = useState<Language>("de");
  const languageInitialized = useRef(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const t = (value: string) => translate(value, language);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Such-, Sortier- und Anzeigeoptionen für Dashboard und Rangliste.
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardUserSearch, setLeaderboardUserSearch] = useState("");
  const [dashboardQuizSort, setDashboardQuizSort] = useState<"createdAt" | "title">("createdAt");
  const [leaderboardQuizSort, setLeaderboardQuizSort] = useState<"createdAt" | "title">("createdAt");
  const [showDashboardQuizzes, setShowDashboardQuizzes] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [desktopPairToken, setDesktopPairToken] = useState<string | null>(null);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [pairingComplete, setPairingComplete] = useState(false);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<number | null>(null);
  const [pairingError, setPairingError] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingRestart, setPairingRestart] = useState(0);

  // Aktueller Quiz-Durchlauf und die Antworten des Teilnehmers.
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizDefinition[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<QuizId>("");
  const [rankingQuizId, setRankingQuizId] = useState<QuizId | "all">("all");
  const [rankingView, setRankingView] = useState<"global" | "mine" | "all">("global");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answersByQuestion, setAnswersByQuestion] = useState<Array<boolean | null>>([]);
  const [answerDraft, setAnswerDraft] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  // Ergebnisse, Ranglisten und Administrationsansicht.
  const [ranking, setRanking] = useState<QuizResult[]>([]);
  const [bestByQuiz, setBestByQuiz] = useState<Partial<Record<QuizId, QuizResult | null>>>({});
  const [savedResult, setSavedResult] = useState<QuizResult | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [ratingSummary, setRatingSummary] = useState<QuizRatingSummary | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [myRating, setMyRating] = useState<Rating | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [ratingError, setRatingError] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<QuizId | null>(null);
  const [quizCreateError, setQuizCreateError] = useState("");
  const [quizCreating, setQuizCreating] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizTitleEn, setNewQuizTitleEn] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");
  const [newQuizDescriptionEn, setNewQuizDescriptionEn] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [exportQuizId, setExportQuizId] = useState<QuizId>("quiz1");
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "pdf" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingQuiz, setImportingQuiz] = useState(false);
  const [importError, setImportError] = useState("");

  // Zeitmessung: Refs ändern sich ohne zusätzlichen Render-Zyklus, State aktualisiert die Anzeige.
  const [elapsedMs, setElapsedMs] = useState(0);
  const quizStartedAt = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  // Abgeleitete Werte für gefilterte Quizkarten, Fortschritt, Punkte und Darstellung.
  const activeQuiz = availableQuizzes.find((quiz) => quiz.id === activeQuizId) ?? availableQuizzes[0] ?? { id: "", title: "", description: "", questions: [] };
  const normalizedDashboardSearch = dashboardSearch.trim().toLocaleLowerCase("de-DE");
  const normalizedLeaderboardSearch = leaderboardSearch.trim().toLocaleLowerCase("de-DE");
  const sortQuizzes = (quizzes: QuizDefinition[], sort: "createdAt" | "title") => [...quizzes].sort((left, right) => sort === "title" ? left.title.localeCompare(right.title, "de-DE") : (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
  const filteredDashboardQuizzes = sortQuizzes(availableQuizzes.filter((quiz) => !normalizedDashboardSearch || `${quiz.title} ${quiz.description}`.toLocaleLowerCase("de-DE").includes(normalizedDashboardSearch)), dashboardQuizSort);
  const filteredLeaderboardQuizzes = sortQuizzes(availableQuizzes.filter((quiz) => !normalizedLeaderboardSearch || `${quiz.title} ${quiz.description}`.toLocaleLowerCase("de-DE").includes(normalizedLeaderboardSearch)), leaderboardQuizSort);
  const question = questions[current] ?? questions[0];
  const score = answersByQuestion.filter(Boolean).length;
  const isDevMode = name.trim() === "1234567899";
  const showFoundingVideo = activeQuizId === "quiz1" && current === 0;
  const progress = finished ? 100 : ((current + (feedback ? 1 : 0)) / questions.length) * 100;
  const audioContextRef = useRef<AudioContext | null>(null);

  // Kleine Töne werden nur nach einer Benutzeraktion abgespielt und blockieren das Quiz nicht.
  function playSound(kind: "correct" | "wrong" | "transition" | "result") {
    if (!soundEnabled || typeof window === "undefined" || !window.AudioContext) return;
    try {
      const context = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = context;
      const frequencies = { correct: 660, wrong: 220, transition: 440, result: 880 };
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = kind === "wrong" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequencies[kind], now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "result" ? 0.28 : 0.14));
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + (kind === "result" ? 0.28 : 0.14));
      void context.resume().catch(() => undefined);
    } catch {
      // Fehlende oder blockierte Audio-Unterstützung darf das Quiz nicht stören.
    }
  }

  // Liest die bevorzugte Sprache beim ersten Laden aus dem Browser-Speicher.
  useEffect(() => {
    const saved = window.localStorage.getItem("roche-language");
    const savedLanguage = saved === "en" ? saved : null;
    const timer = window.setTimeout(() => {
      languageInitialized.current = true;
      if (savedLanguage) setLanguage(savedLanguage);
      else window.localStorage.setItem("roche-language", "de");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Hält das lang-Attribut der HTML-Seite und den gespeicherten Sprachwert synchron.
  useEffect(() => {
    document.documentElement.lang = language;
    if (languageInitialized.current) window.localStorage.setItem("roche-language", language);
  }, [language]);

  // Öffnet den Passwort-Reset automatisch, wenn ein gültiger Reset-Link aufgerufen wurde.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("resetToken");
    if (!token) return;
    const timer = window.setTimeout(() => {
      setResetToken(token);
      setShowPasswordReset(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Lädt die Quizkarten erneut, wenn die Sprache gewechselt wurde.
  useEffect(() => {
    void fetchQuizCatalog(language).then(setAvailableQuizzes).catch(() => undefined);
  }, [language]);

  // Der QR-Code enthält nur ein kurzlebiges Einmal-Token, niemals Zugangsdaten.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("pair");
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return;
    const timer = window.setTimeout(() => setPairToken(token), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Desktop startet eine neue Kopplung. Die URL nutzt window.location.origin, damit auch eine LAN-IP funktioniert.
  useEffect(() => {
    let cancelled = false;
    async function startDesktopPairing() {
      if (new URLSearchParams(window.location.search).has("pair")) return;
      const response = await fetch("/api/auth/pair/start", { method: "POST", cache: "no-store" });
      const data = await response.json() as { token?: string; expiresAt?: number };
      if (!response.ok || !data.token || !data.expiresAt || cancelled) return;
      const configuredOrigin = process.env.NEXT_PUBLIC_PAIRING_ORIGIN?.trim();
      const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
      const pairingOrigin = configuredOrigin || (isLocalHost ? "http://100.90.82.24:3000" : window.location.origin);
      const pairUrl = new URL("/pair/" + encodeURIComponent(data.token), pairingOrigin).toString();
      const qrcodeModule = await import("qrcode");
      const qrcode = qrcodeModule.default ?? qrcodeModule;
      const dataUrl = await qrcode.toDataURL(pairUrl, { width: 180, margin: 2, errorCorrectionLevel: "M" });
      if (cancelled) return;
      setDesktopPairToken(data.token);
      setPairingExpiresAt(data.expiresAt);
      setQrCodeUrl(dataUrl);
    }
    void startDesktopPairing().catch(() => undefined);
    return () => { cancelled = true; };
  }, [pairingRestart]);

  // Der Desktop fragt den Status ab; nur dieser Request erhält danach das HttpOnly-Session-Cookie.
  useEffect(() => {
    if (!desktopPairToken || pairToken || user) return;
    let cancelled = false;
    const pairingToken = desktopPairToken;
    async function pollPairing() {
      const response = await fetch(`/api/auth/pair/status?token=${encodeURIComponent(pairingToken)}`, { cache: "no-store", credentials: "include" });
      const data = await response.json().catch(() => ({})) as { status?: string; user?: User };
      if (cancelled) return;
      if (data.status === "completed" && data.user) {
        setUser(data.user);
        setName(data.user.username);
        setDesktopPairToken(null);
        setQrCodeUrl("");
        setPairingExpiresAt(null);
      } else if (data.status === "expired") {
        cancelled = true;
        setDesktopPairToken(null);
        setQrCodeUrl("");
        setPairingExpiresAt(null);
        setPairingRestart((value) => value + 1);
      }
    }
    void pollPairing().catch(() => undefined);
    const interval = window.setInterval(() => { void pollPairing().catch(() => undefined); }, 2000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [desktopPairToken, pairToken, user]);

  // Prüft beim Start, ob für diesen Browser bereits eine gültige Sitzung existiert.
  useEffect(() => {
    void fetch("/api/auth/me").then((response) => response.json()).then((data: { user: User | null }) => {
      if (data.user) {
        setUser(data.user);
        setName(data.user.username);
      }
    }).catch(() => undefined);
  }, []);

  // Lädt die globalen Bestwerte für die Karten im Dashboard.
  useEffect(() => {
    let cancelled = false;
    async function loadBestResults() {
      const responses = await Promise.all(availableQuizzes.map((quiz) => fetch(`/api/leaderboard?quizId=${encodeURIComponent(quiz.id)}&view=global`)));
      const data = await Promise.all(responses.map((response) => response.json() as Promise<{ quizId?: string; myResult?: QuizResult | null }>));
      if (cancelled) return;
      const nextBest: Partial<Record<QuizId, QuizResult | null>> = {};
      data.forEach((item) => {
        if (item.quizId) nextBest[item.quizId] = item.myResult ?? null;
      });
      setBestByQuiz(nextBest);
    }
    void loadBestResults().catch(() => undefined);
    return () => { cancelled = true; };
  }, [availableQuizzes, user]);

  // Lädt je nach Umschalter entweder die globale Rangliste oder die eigene Historie.
  useEffect(() => {
    if (!showRanking) return;
    let cancelled = false;
    async function loadRanking() {
      const searchParam = rankingView === "global" && leaderboardUserSearch.trim() ? `&search=${encodeURIComponent(leaderboardUserSearch.trim())}` : "";
      const response = await fetch(`/api/leaderboard?quizId=${encodeURIComponent(rankingQuizId)}&view=${rankingView}${searchParam}`);
      const data = await response.json() as { results?: QuizResult[]; error?: string };
      if (cancelled) return;
      if (!response.ok) {
        setRanking([]);
        setAuthError(translate(data.error ?? "Die Rangliste konnte nicht geladen werden.", language));
        return;
      }
      setRanking(data.results ?? []);
      setAuthError("");
    }
    void loadRanking().catch(() => setAuthError(translate("Die Rangliste konnte nicht geladen werden.", language)));
    return () => { cancelled = true; };
  }, [language, leaderboardUserSearch, rankingQuizId, rankingView, showRanking]);

  // Lädt nach Abschluss des Quiz die Bewertungen für das Ergebnisfenster.
  useEffect(() => {
    if (!finished) return;
    void loadRatings(activeQuizId).catch(() => setRatingError("Die Bewertungen konnten nicht geladen werden."));
  }, [activeQuizId, finished]);

  useEffect(() => {
    if (!started || finished) return;
    // Der Startzeitpunkt wird im Effekt gesetzt, damit Rendern rein und stabil bleibt.
    if (quizStartedAt.current === null) quizStartedAt.current = Date.now();
    const timer = window.setInterval(() => {
      const nextElapsedMs = Date.now() - (quizStartedAt.current ?? Date.now());
      elapsedRef.current = nextElapsedMs;
      setElapsedMs(nextElapsedMs);
    }, 100);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  // Setzt alle quizbezogenen Zustände zurück und startet einen neuen, gemischten Durchlauf.
  function beginQuiz(quizId: QuizId) {
    const quiz = availableQuizzes.find((item) => item.id === quizId);
    if (!quiz || quiz.questions.length === 0) return;
    const nextQuestions = createQuiz(quiz);
    setActiveQuizId(quizId);
    setQuestions(nextQuestions);
    setCurrent(0);
    setAnswersByQuestion(Array(nextQuestions.length).fill(null));
    setAnswerDraft("");
    setAnswerError("");
    setFeedback(null);
    setFinished(false);
    setSavedResult(null);
    setShowRanking(false);
    setElapsedMs(0);
    elapsedRef.current = 0;
    quizStartedAt.current = null;
    setStarted(true);
  }

  // Aktualisiert ein einzelnes Feld einer Frage im Admin-Editor.
  function updateDraftQuestion(index: number, changes: Partial<DraftQuestion>) {
    setDraftQuestions((previous) => previous.map((question, questionIndex) => questionIndex === index ? { ...question, ...changes } : question));
  }

  // Aktualisiert eine Antwort in der deutschen oder englischen Variante des Editors.
  function updateDraftAnswer(questionIndex: number, answerIndex: number, value: string, language: Language = "de") {
    setDraftQuestions((previous) => previous.map((question, index) => {
      if (index !== questionIndex) return question;
      const answers = [...(language === "en" ? question.answersEn : question.answers)];
      answers[answerIndex] = value;
      return language === "en" ? { ...question, answersEn: answers } : { ...question, answers };
    }));
  }

  // Lädt die deutsche Originalversion eines Quiz und öffnet sie im Bearbeitungsformular.
  async function editQuiz(quiz: QuizDefinition) {
    const germanQuiz = (await fetchQuizCatalog("de").catch(() => [])).find((item) => item.id === quiz.id) ?? quiz;
    setEditingQuizId(germanQuiz.id);
    setNewQuizTitle(germanQuiz.title);
    setNewQuizTitleEn(germanQuiz.titleEn ?? "");
    setNewQuizDescription(germanQuiz.description);
    setNewQuizDescriptionEn(germanQuiz.descriptionEn ?? "");
    setDraftQuestions(germanQuiz.questions.map(draftFromQuestion));
    setQuizCreateError("");
    setShowQuizCreator(true);
  }

  // Löscht ein eigenes Quiz nach Bestätigung und entfernt zugehörige lokale Anzeigezustände.
  async function deleteCustomQuiz(quizId: QuizId) {
    const quiz = availableQuizzes.find((item) => item.id === quizId);
    if (!quiz || !window.confirm(`${t("Quiz wirklich löschen")}: „${quiz.title}“? ${t("Highscores werden ebenfalls entfernt.")}`)) return;
    try {
      const response = await fetch("/api/quizzes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quizId }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setQuizCreateError(t(data.error ?? "Das Quiz konnte nicht gelöscht werden."));
        return;
      }
      setAvailableQuizzes((previous) => previous.filter((item) => item.id !== quizId));
      setBestByQuiz((previous) => { const next = { ...previous }; delete next[quizId]; return next; });
      if (rankingQuizId === quizId) setRankingQuizId("quiz1");
      if (exportQuizId === quizId) setExportQuizId("quiz1");
      if (activeQuizId === quizId) setActiveQuizId("quiz1");
      if (editingQuizId === quizId) { setShowQuizCreator(false); setEditingQuizId(null); }
    } catch {
      setQuizCreateError(t("Server ist momentan nicht erreichbar."));
    }
  }

  // Fordert den Ranglistenexport beim Server an und startet anschließend den Browser-Download.
  async function downloadLeaderboard(format: "xlsx" | "pdf") {
    setExportingFormat(format);
    setAuthError("");
    try {
      const response = await fetch(`/api/admin/export?quizId=${encodeURIComponent(exportQuizId)}&format=${format}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setAuthError(t(data.error ?? "Der Export konnte nicht erstellt werden."));
        return;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${exportQuizId}-rangliste.${format}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setAuthError("Der Export konnte nicht erstellt werden.");
    } finally {
      setExportingFormat(null);
    }
  }

  // Sendet die ausgewählte XLSX-Datei als Multipart-Formular an den Import-Endpunkt.
  async function importQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importFile) {
      setImportError(t("Bitte wähle eine XLSX-Datei aus."));
      return;
    }
    setImportingQuiz(true);
    setImportError("");
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setImportError(t(data.error ?? "Das Quiz konnte nicht importiert werden."));
        return;
      }
      setAvailableQuizzes(await fetchQuizCatalog(language));
      setImportFile(null);
      setImportError("");
    } catch {
      setImportError("Das Quiz konnte nicht importiert werden.");
    } finally {
      setImportingQuiz(false);
    }
  }

  // Validiert und speichert ein neues Quiz oder die Änderungen an einem bestehenden Quiz.
  async function saveNewQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuizCreateError("");
    if (!newQuizTitle.trim() || !newQuizDescription.trim() || draftQuestions.length === 0) {
      setQuizCreateError(t("Bitte gib Titel, Beschreibung und mindestens eine Frage ein."));
      return;
    }
    setQuizCreating(true);
    try {
      const response = await fetch("/api/quizzes", {
        method: editingQuizId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingQuizId ? { quizId: editingQuizId } : {}),
          title: newQuizTitle,
          titleEn: newQuizTitleEn,
          description: newQuizDescription,
          descriptionEn: newQuizDescriptionEn,
          questions: draftQuestions.map((question) => question.kind === "multiple-choice"
            ? { kind: question.kind, question: question.question, questionEn: question.questionEn, answers: question.answers, answersEn: question.answersEn, correctIndex: question.correctIndex }
            : question.kind === "text"
              ? { kind: question.kind, question: question.question, questionEn: question.questionEn, expectedAnswer: question.expectedAnswer, expectedAnswerEn: question.expectedAnswerEn }
              : question.kind === "true-false"
                ? { kind: question.kind, question: question.question, questionEn: question.questionEn, expectedBoolean: question.expectedBoolean }
                : { kind: question.kind, question: question.question, questionEn: question.questionEn, expectedNumber: Number(question.expectedNumber), unit: question.unit, unitEn: question.unitEn }),
        }),
      });
      const data = await response.json() as { quiz?: QuizDefinition; error?: string };
      if (!response.ok || !data.quiz) {
        setQuizCreateError(t(data.error ?? "Das Quiz konnte nicht gespeichert werden."));
        return;
      }
      setAvailableQuizzes(await fetchQuizCatalog(language));
      setNewQuizTitle("");
      setNewQuizTitleEn("");
      setNewQuizDescription("");
      setNewQuizDescriptionEn("");
      setDraftQuestions([]);
      setEditingQuizId(null);
      setShowQuizCreator(false);
    } catch {
      setQuizCreateError(t("Server ist momentan nicht erreichbar."));
    } finally {
      setQuizCreating(false);
    }
  }

  // Fordert einen Passwort-Reset-Link an und übernimmt den Demo-Token, falls der Server ihn liefert.
  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetMessage("");
    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });
    const data = await response.json().catch(() => ({})) as { message?: string; resetToken?: string; resetUrl?: string };
    setResetMessage(data.resetToken ? t("Ein Link zum Zurücksetzen wurde versendet.") : t("Ein Link zum Zurücksetzen wurde versendet."));
    if (data.resetToken) setResetToken(data.resetToken);
  }

  // Bestätigt den Passwort-Reset mit Token und neuem Passwort.
  async function confirmPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetMessage("");
    const response = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    });
    const data = await response.json().catch(() => ({})) as { message?: string; error?: string };
    setResetMessage(data.error ?? data.message ?? t("Der Zurücksetzungs-Token ist ungültig oder abgelaufen."));
    if (response.ok) {
      setResetPassword("");
      setResetToken("");
    }
  }

  // Anmeldung und Registrierung führen bewusst nur zum Dashboard, nicht direkt zum Quiz.
  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 25) {
      setAuthError(t("Der Benutzername muss 1 bis 25 Zeichen lang sein."));
      return;
    }
    if (!password) {
      setAuthError(t("Bitte gib dein Passwort ein."));
      return;
    }
    if (authMode === "register" && !email.trim()) {
      setAuthError(t("Bitte gib eine gültige E-Mail-Adresse ein."));
      return;
    }

    setLoading(true);
    setAuthError("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanName, email: authMode === "register" ? email.trim() : undefined, password }),
      });
      const data = await response.json() as { user?: User; error?: string };
      if (!response.ok || !data.user) {
        setAuthError(data.error ?? "Die Anmeldung ist fehlgeschlagen.");
        return;
      }
      setUser(data.user);
      setName(data.user.username);
      setPassword("");
      setEmail("");
    } catch {
      setAuthError(t("Server ist momentan nicht erreichbar."));
    } finally {
      setLoading(false);
    }
  }

  // Führt die Anmeldung auf dem Mobilgerät aus und schließt danach die Desktop-Kopplung ab.
  async function handlePairingAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pairToken) return;
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 25) {
      setPairingError(t("Der Benutzername muss 1 bis 25 Zeichen lang sein."));
      return;
    }
    if (!password) {
      setPairingError(t("Bitte gib dein Passwort ein."));
      return;
    }
    if (authMode === "register" && !email.trim()) {
      setPairingError(t("Bitte gib eine gültige E-Mail-Adresse ein."));
      return;
    }

    setPairingLoading(true);
    setPairingError("");
    try {
      const response = await fetch("/api/auth/pair/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: pairToken, mode: authMode, username: cleanName, email: authMode === "register" ? email.trim() : undefined, password }),
      });
      const data = await response.json() as { user?: User; error?: string };
      if (!response.ok || !data.user) {
        setPairingError(data.error ?? "Die Anmeldung konnte nicht abgeschlossen werden.");
        return;
      }
      setUser(data.user);
      setName(data.user.username);
      setPassword("");
      setPairingComplete(true);
    } catch {
      setPairingError(t("Server ist momentan nicht erreichbar."));
    } finally {
      setPairingLoading(false);
    }
  }

  // Meldet den Benutzer serverseitig ab und setzt die lokalen Ansichten zurück.
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setStarted(false);
    setFinished(false);
    setSavedResult(null);
    setShowRanking(false);
    setShowAdmin(false);
    setPassword("");
    setShowPassword(false);
    setPairingRestart((value) => value + 1);
  }

  // Löscht das eigene Konto erst nach einer Sicherheitsabfrage.
  async function deleteAccount() {
    if (!window.confirm(t("Möchtest du deinen Account wirklich löschen? Deine Highscore-Daten werden ebenfalls entfernt."))) return;
    const response = await fetch("/api/auth/delete", { method: "DELETE" });
    if (!response.ok) {
      setAuthError(t("Der Account konnte nicht gelöscht werden."));
      return;
    }
    setUser(null);
    setStarted(false);
    setFinished(false);
    setSavedResult(null);
    setShowAdmin(false);
    setPassword("");
  }

  // Lädt die Benutzerverwaltung für Admins mit optionalem Suchbegriff.
  async function loadAdminUsers(search = adminSearch) {
    const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
    const data = await response.json() as { users?: AdminUser[]; error?: string };
    if (!response.ok) {
      setAuthError(data.error ?? "Die Admin-Daten konnten nicht geladen werden.");
      return;
    }
    setAdminUsers(data.users ?? []);
    setShowAdmin(true);
  }

  // Löscht einen Benutzer aus der Adminverwaltung und aktualisiert betroffene Listen.
  async function deleteAdminUser(userId: number) {
    if (!window.confirm(t("Diesen Benutzer wirklich löschen?"))) return;
    const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setAuthError(data.error ?? "Der Benutzer konnte nicht gelöscht werden.");
      return;
    }
    setAdminUsers((users) => users.filter((item) => item.id !== userId));
    setRanking((items) => items.filter((item) => item.id !== userId));
    if (user?.id === userId) {
      setUser(null);
      setShowAdmin(false);
      setStarted(false);
      setFinished(false);
      setSavedResult(null);
      setPassword("");
    }
  }

  // Ändert die Rolle eines Benutzers und spiegelt die Änderung direkt in der Tabelle wider.
  async function changeUserRole(userId: number, role: "user" | "admin") {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setAuthError(data.error ?? "Die Rolle konnte nicht geändert werden.");
      return;
    }
    setAdminUsers((users) => users.map((item) => item.id === userId ? { ...item, role } : item));
  }

  // Speichert das Endergebnis, berechnet den Prozentsatz und aktualisiert die Rangliste.
  async function submitScore(finalScore: number, finalElapsedMs: number) {
    try {
      const response = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: activeQuizId, correct: finalScore, total: questions.length, elapsedMs: finalElapsedMs }),
      });
      const data = await response.json() as { result?: Omit<QuizResult, "percentage" | "rank">; rank?: number | null; leaderboard?: QuizResult[]; error?: string };
      if (!response.ok || !data.result) {
        setAuthError(data.error ?? "Das Ergebnis konnte nicht gespeichert werden.");
        return;
      }
      const result = { ...data.result, percentage: Math.round((data.result.correct / data.result.total) * 100), rank: data.rank ?? 0 };
      setSavedResult(result);
      setBestByQuiz((previous) => ({ ...previous, [activeQuizId]: result }));
      if (data.leaderboard) setRanking(data.leaderboard);
    } catch {
      setAuthError("Das Ergebnis konnte nicht gespeichert werden.");
    }
  }

  // Lädt Bewertungsübersicht und einzelne Kommentare, optional nach Sternezahl gefiltert.
  async function loadRatings(quizId: QuizId, filter: number | null = null) {
    const filterParam = filter ? `&stars=${filter}` : "";
    const response = await fetch(`/api/ratings?quizId=${encodeURIComponent(quizId)}${filterParam}`, { cache: "no-store" });
    const data = await response.json() as { summary?: QuizRatingSummary; ratings?: Rating[]; myRating?: Rating | null; error?: string };
    if (!response.ok) throw new Error(t(data.error ?? "Bewertungen konnten nicht geladen werden."));
    setRatingSummary(data.summary ?? null);
    setRatings(data.ratings ?? []);
    setMyRating(data.myRating ?? null);
    if (data.myRating) {
      setRatingStars(data.myRating.stars);
      setRatingComment(data.myRating.comment);
    }
  }

  // Prüft Sternezahl und Kommentarlänge und speichert anschließend die Bewertung.
  async function saveRating() {
    if (!ratingStars || ratingComment.length > 500) {
      setRatingError(t("Bitte wähle 1 bis 5 Sterne. Der Kommentar darf höchstens 500 Zeichen lang sein."));
      return;
    }
    setRatingSaving(true);
    setRatingError("");
    try {
      const response = await fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quizId: activeQuizId, stars: ratingStars, comment: ratingComment }) });
      const data = await response.json() as { summary?: QuizRatingSummary; rating?: Rating; error?: string };
      if (!response.ok || !data.rating) {
        setRatingError(t(data.error ?? "Die Bewertung konnte nicht gespeichert werden."));
        return;
      }
      setMyRating(data.rating);
      setRatingSummary(data.summary ?? null);
      setAvailableQuizzes((quizzes) => quizzes.map((quiz) => quiz.id === activeQuizId ? { ...quiz, ratingAverage: data.summary?.ratingAverage, ratingCount: data.summary?.ratingCount, ratingDistribution: data.summary?.ratingDistribution } : quiz));
      await loadRatings(activeQuizId, ratingFilter);
    } catch {
      setRatingError(t("Bewertungen konnten nicht geladen werden."));
    } finally {
      setRatingSaving(false);
    }
  }

  // Ermittelt für jeden Fragetyp die Antwort, die im Feedback angezeigt werden soll.
  function expectedAnswerFor(questionToCheck: Question): string {
    if (questionToCheck.kind === "multiple-choice") return questionToCheck.answers.find((answer) => answer.correct)?.text ?? "";
    if (questionToCheck.kind === "true-false") return questionToCheck.expectedBoolean ? t("Wahr") : t("Falsch");
    return questionToCheck.feedbackAnswer;
  }

  // Baut das Feedback für eine bereits beantwortete Frage erneut auf, z. B. beim Zurückgehen.
  function feedbackForQuestion(index: number): Feedback | null {
    const answeredQuestion = questions[index];
    const answer = answersByQuestion[index];
    if (!answeredQuestion || answer === null || answer === undefined) return null;
    return { correct: answer, expected: expectedAnswerFor(answeredQuestion) };
  }

  // Speichert eine Antwort und zeigt bei allen Fragetypen dasselbe Feedback an.
  function recordAnswer(isCorrect: boolean, expected: string) {
    setAnswersByQuestion((previousAnswers) => {
      const updatedAnswers = [...previousAnswers];
      updatedAnswers[current] = isCorrect;
      return updatedAnswers;
    });
    setFeedback({ correct: isCorrect, expected });
    playSound(isCorrect ? "correct" : "wrong");
    setAnswerError("");
  }

  // Verarbeitet eine ausgewählte Multiple-Choice-Antwort nur einmal.
  function chooseAnswer(answer: Answer) {
    if (feedback || answersByQuestion[current] !== null) return;
    recordAnswer(answer.correct, answer.text);
  }

  // Prüft eine Wahr/Falsch-Auswahl gegen den erwarteten Boolean-Wert.
  function chooseBooleanAnswer(value: boolean) {
    if (feedback || answersByQuestion[current] !== null || question.kind !== "true-false") return;
    recordAnswer(value === question.expectedBoolean, question.expectedBoolean ? t("Wahr") : t("Falsch"));
  }

  // Prüft freie Text- und Zahleneingaben und verwendet danach dieselbe Feedbacklogik.
  function submitFreeAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (feedback || answersByQuestion[current] !== null) return;
    setAnswerError("");
    if (!answerDraft.trim()) {
      setAnswerError("Bitte gib eine Antwort ein.");
      return;
    }
    if (question.kind === "text") {
      const normalized = normalizeAnswer(answerDraft);
      const isCorrect = question.expectedAnswers.some((expected) => normalizeAnswer(expected) === normalized);
      recordAnswer(isCorrect, question.feedbackAnswer);
      return;
    }
    if (question.kind === "number") {
      const isInteger = /^-?\d+$/.test(answerDraft.trim());
      const isCorrect = isInteger && Number(answerDraft.trim()) === question.expectedNumber;
      recordAnswer(isCorrect, question.feedbackAnswer);
    }
  }

  // Erst nach dem sichtbaren Feedback geht es zur nächsten Frage oder zum Ergebnis.
  function continueQuiz() {
    if (!feedback) return;
    if (current === questions.length - 1) {
      playSound("result");
      const finalElapsedMs = elapsedRef.current;
      setElapsedMs(finalElapsedMs);
      setRatingFilter(null);
      setFinished(true);
      void submitScore(score, finalElapsedMs);
      return;
    }
    playSound("transition");
    const nextIndex = current + 1;
    setCurrent(nextIndex);
    setAnswerDraft("");
    setAnswerError("");
    setFeedback(feedbackForQuestion(nextIndex));
  }

  // Geht eine bereits beantwortete Frage zurück, ohne die gespeicherte Antwort zu verlieren.
  function previousQuestion() {
    if (current === 0) return;
    const previousIndex = current - 1;
    setCurrent(previousIndex);
    setAnswerDraft("");
    setAnswerError("");
    setFeedback(feedbackForQuestion(previousIndex));
  }

  // Das Logo führt eingeloggte Personen zum Dashboard und andere zur Startansicht zurück.
  function goHome() {
    if (user) {
      backToDashboard();
      return;
    }
    setStarted(false);
    setFinished(false);
    setShowRanking(false);
    setSavedResult(null);
  }

  // Beendet die aktuelle Ansicht, setzt die Quizzeit zurück und zeigt wieder das Dashboard.
  function backToDashboard() {
    setStarted(false);
    setFinished(false);
    setSavedResult(null);
    setShowRanking(false);
    setFeedback(null);
    elapsedRef.current = 0;
    quizStartedAt.current = null;
  }

  // Gemeinsame Tailwind-Klassen für helles/dunkles Design und Antwortfarben.
  const pageBackground = darkMode ? "bg-[#101820] text-slate-100" : "bg-[#f4f7fa] text-[#172b4d]";
  const cardBackground = darkMode ? "border-slate-700 bg-slate-900/95" : "border-slate-200 bg-white";
  const mutedText = darkMode ? "text-slate-300" : "text-slate-600";
  const answerColors = darkMode
    ? ["border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20", "border-red-400/50 bg-red-400/10 hover:bg-red-400/20", "border-yellow-400/50 bg-yellow-400/10 hover:bg-yellow-400/20", "border-emerald-400/50 bg-emerald-400/10 hover:bg-emerald-400/20"]
    : ["border-blue-200 bg-blue-50 hover:bg-blue-100", "border-red-200 bg-red-50 hover:bg-red-100", "border-yellow-200 bg-yellow-50 hover:bg-yellow-100", "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"];
  const answerLetters = ["A", "B", "C", "D"];

  // Das JSX rendert abhängig vom Zustand genau eine Hauptansicht: Rangliste,
  // Kopplung/Anmeldung, Dashboard, Ergebnis oder die aktuell laufende Frage.
  return (
    <main className={`roche-app relative min-h-screen overflow-hidden transition-colors duration-300 ${darkMode ? "roche-dark" : ""} ${pageBackground}`}>
      {/* Rein dekorative Formen im Hintergrund; aria-hidden blendet sie für Screenreader aus. */}
      <div className="roche-ornaments pointer-events-none absolute inset-0 opacity-60" aria-hidden="true"><div className="absolute -left-24 top-36 h-64 w-64 rounded-full border-[42px] border-red-500/60 [clip-path:inset(0_0_50%_0)] -rotate-12" /><div className="absolute -right-20 bottom-24 h-72 w-72 rounded-full border-[46px] border-yellow-400/60 [clip-path:inset(50%_0_0_0)] rotate-12" /><div className="absolute right-[12%] top-24 h-28 w-28 rotate-12 rounded-[42%_58%_65%_35%] border-[20px] border-blue-500/25" /></div>

      {/* Kopfzeile mit Logo, Ranglisten-Schalter, Sprache und Produktbezeichnung. */}
      <header className={`roche-header relative z-30 flex w-full items-center justify-between border-b px-5 py-4 shadow-sm lg:px-10 ${darkMode ? "border-slate-700 bg-[#101820]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-4"><button type="button" onClick={goHome} className="roche-logo-button rounded-md bg-transparent p-0 transition hover:bg-transparent hover:opacity-75 focus:bg-transparent focus:outline-none focus:ring-0 active:bg-transparent" aria-label={user ? t("Zum Dashboard") : t("Zur Startseite")}><Image src="/roche-logo.png" alt="Roche" width={150} height={60} priority unoptimized className="h-4 w-12 object-contain sm:h-5 sm:w-16" /></button><span className={`hidden border-l pl-3 text-[10px] font-semibold tracking-[0.16em] sm:block ${mutedText}`}>{t("DIAGNOSTICS & PHARMA")}</span></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setShowRanking((value) => !value)} aria-pressed={showRanking} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition hover:border-blue-700 hover:text-blue-700 ${darkMode ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`}>{t("Rangliste")}</button><div className="relative"><button type="button" onClick={() => setShowLanguageMenu((value) => !value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${darkMode ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`} aria-label={t("Sprache")}>🌐 {language.toUpperCase()}</button>{showLanguageMenu && <div className={`absolute right-0 top-11 z-30 grid min-w-32 gap-1 rounded-xl border p-2 shadow-xl ${darkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}><button type="button" onClick={() => { setLanguage("de"); setShowLanguageMenu(false); }} className="rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100">{t("Deutsch")}</button><button type="button" onClick={() => { setLanguage("en"); setShowLanguageMenu(false); }} className="rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100">{t("Englisch")}</button></div>}</div><div className={`hidden text-xs font-semibold uppercase tracking-[0.18em] sm:block ${mutedText}`}>{t("Wissenstest")} <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-500" /></div></div>
      </header>

      {/* In diesem Bereich wird anhand der Zustände die passende Seite angezeigt. */}
      <section className="roche-content relative z-10 mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-6xl items-center justify-center px-6 pb-12 pt-8 lg:px-10">
        {/* Öffentliche Rangliste mit Quizfilter, Nutzerfilter und Ergebnisliste. */}
        {showRanking ? (
          <section className={`roche-panel w-full max-w-3xl rounded-[2rem] border p-8 shadow-2xl md:p-12 ${cardBackground}`}>
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">{t("Roche Wissenstest")}</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{t("Rangliste")}</h1></div><span className={`rounded-full px-3 py-2 text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{t("Serverseitig gespeichert")}</span></div>
            <div className="mt-8">
              <label htmlFor="leaderboard-search" className="sr-only">{t("Quiz in der Rangliste suchen")}</label>
              <div className="relative">
                <input id="leaderboard-search" type="search" value={leaderboardSearch} onChange={(event) => setLeaderboardSearch(event.target.value)} placeholder={t("Quiz nach Titel oder Beschreibung suchen …")} className={`w-full rounded-xl border px-4 py-3 pr-24 text-sm outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} />
                {leaderboardSearch && <button type="button" onClick={() => setLeaderboardSearch("")} className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold ${darkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100"}`}>{t("Löschen")}</button>}
              </div>
              <label className={`mt-3 block text-xs ${mutedText}`}>{t("Quiz-Sortierung")}<select value={leaderboardQuizSort} onChange={(event) => setLeaderboardQuizSort(event.target.value as "createdAt" | "title")} className={`ml-2 rounded-lg border px-2 py-1 text-xs ${darkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}><option value="createdAt">{t("Neueste")}</option><option value="title">{t("Alphabetisch")}</option></select></label>
            </div>
            {filteredLeaderboardQuizzes.length > 0 ? <div className={`mt-3 flex flex-wrap gap-2 rounded-xl p-1 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>{filteredLeaderboardQuizzes.map((quiz) => <button key={quiz.id} type="button" onClick={() => { setRankingQuizId(quiz.id); setRankingView("global"); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${rankingQuizId === quiz.id ? "bg-blue-700 text-white" : mutedText}`}>{quiz.title}</button>)}</div> : <p className={`mt-3 rounded-xl border border-dashed p-5 text-center text-sm ${mutedText}`}>{t("Keine passenden Quizze gefunden.")}</p>}
            {rankingView === "global" && <div className="mt-4"><label htmlFor="leaderboard-user-search" className="sr-only">{t("Nutzername oder Nutzer-ID in der Rangliste suchen")}</label><input id="leaderboard-user-search" type="search" value={leaderboardUserSearch} onChange={(event) => setLeaderboardUserSearch(event.target.value)} placeholder={t("Nutzername oder Nutzer-ID suchen …")} className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} /></div>}
            <div className={`mt-3 grid grid-cols-3 rounded-xl p-1 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}><button type="button" onClick={() => { setRankingQuizId(rankingQuizId === "all" ? "quiz1" : rankingQuizId); setRankingView("global"); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${rankingView === "global" ? "bg-blue-700 text-white" : mutedText}`}>{t("Global")}</button><button type="button" onClick={() => { setRankingQuizId(rankingQuizId === "all" ? "quiz1" : rankingQuizId); setRankingView("mine"); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${rankingView === "mine" ? "bg-blue-700 text-white" : mutedText}`}>{t("Meine Ergebnisse")}</button><button type="button" onClick={() => { setRankingQuizId("all"); setRankingView("all"); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${rankingView === "all" ? "bg-blue-700 text-white" : mutedText}`}>{t("Alle Ergebnisse")}</button></div>
            {ranking.length === 0 ? <p className={`mt-10 rounded-xl border border-dashed p-8 text-center ${mutedText}`}>{rankingView === "all" ? "Noch keine eigenen Ergebnisse vorhanden." : "Noch keine Ergebnisse für dieses Quiz vorhanden."}</p> : <ol className="mt-8 space-y-3" aria-label={t("Rangliste")}>{ranking.map((result) => <li key={`${result.quizId}-${result.id}`} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${savedResult?.id === result.id && savedResult.quizId === result.quizId ? "border-blue-600 ring-2 ring-blue-200" : darkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${rankingView === "global" && result.rank === 1 ? "bg-yellow-300 text-yellow-950" : rankingView === "global" && result.rank === 2 ? "bg-slate-300 text-slate-800" : rankingView === "global" && result.rank === 3 ? "bg-orange-300 text-orange-950" : darkMode ? "bg-slate-700 text-slate-200" : "bg-white text-slate-600"}`}>{rankingView === "global" ? result.rank : result.attemptNumber}</span><span className="min-w-0 flex-1 truncate font-semibold">{result.username}<span className={`ml-2 text-xs font-normal ${mutedText}`}>{result.publicId}</span>{rankingView === "all" && <span className={`ml-2 text-xs font-normal ${mutedText}`}>{availableQuizzes.find((quiz) => quiz.id === result.quizId)?.title ?? result.quizId}</span>}{rankingView === "mine" && <span className={`ml-2 text-xs font-normal ${mutedText}`}>{t("Versuch")} {result.attemptNumber}</span>}</span><span className="text-right text-sm font-semibold"><strong>{result.correct}/{result.total}</strong><span className={`ml-2 text-xs font-normal ${mutedText}`}>{result.percentage}% · {formatElapsed(result.elapsedMs)} · {rankingView === "global" ? `${result.attempts ?? 0} ${t("Versuche")}` : new Date(result.completedAt).toLocaleDateString(language === "en" ? "en-US" : "de-DE")}</span></span></li>)}</ol>}
            <button type="button" onClick={() => setShowRanking(false)} className="mt-8 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800">{t("Zurück zum Dashboard")} <span aria-hidden="true">→</span></button>
          </section>
        ) : pairToken && !pairingComplete ? (
          <div className={`roche-panel w-full max-w-md rounded-[2rem] border p-7 shadow-2xl md:p-10 ${cardBackground}`}>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">{t("Desktop verbinden")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{t("Anmelden mit dem Handy")}</h1>
            <p className={`mt-4 text-sm leading-6 ${mutedText}`}>{t("Melde dich an oder registriere dich. Danach wird der Computer, von dem du den QR-Code gescannt hast, automatisch angemeldet.")}</p>
            <form className="mt-7" onSubmit={handlePairingAuth}>
              <div className={`mb-5 grid grid-cols-2 rounded-xl p-1 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}><button type="button" onClick={() => { setAuthMode("login"); setPairingError(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "login" ? "bg-blue-700 text-white" : mutedText}`}>{t("Anmelden")}</button><button type="button" onClick={() => { setAuthMode("register"); setPairingError(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "register" ? "bg-blue-700 text-white" : mutedText}`}>{t("Registrieren")}</button></div>
              <label htmlFor="pair-name" className="font-semibold">{t("Benutzername")}</label><input id="pair-name" type="text" value={name} onChange={(event) => { setName(event.target.value); setPairingError(""); }} placeholder={t("Maximal 25 Zeichen")} maxLength={25} autoComplete="username" required className={`mt-3 w-full rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} />
              {authMode === "register" && <><label htmlFor="pair-email" className="mt-4 block font-semibold">{t("E-Mail-Adresse")}</label><input id="pair-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setPairingError(""); }} placeholder={t("E-Mail-Adresse eingeben")} autoComplete="email" required className={`mt-3 w-full rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} /></>}
              <label htmlFor="pair-password" className="mt-4 block font-semibold">{t("Passwort")}</label><input id="pair-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setPairingError(""); }} placeholder={t("Dein Passwort")} autoComplete={authMode === "login" ? "current-password" : "new-password"} required className={`mt-3 w-full rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} />
              {authMode === "register" && <small className={`mt-2 block ${mutedText}`}>{t("Mindestens 12 Zeichen, Zahl, Groß-/Kleinbuchstabe und Sonderzeichen.")}</small>}{pairingError && <p className="mt-3 text-sm font-medium text-red-600">{pairingError}</p>}<button className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pairingLoading}>{pairingLoading ? t("Bitte warten …") : authMode === "login" ? t("Anmelden und verbinden") : t("Registrieren und verbinden")} <span aria-hidden="true">→</span></button>
            </form>
          </div>
        ) : pairToken && pairingComplete ? (
          <div className={`roche-panel w-full max-w-md rounded-[2rem] border p-8 text-center shadow-2xl md:p-12 ${cardBackground}`}>
            <p className="text-4xl" aria-hidden="true">✓</p><h1 className="mt-4 text-3xl font-bold">{t("Desktop verbunden")}</h1><p className={`mt-4 text-sm leading-6 ${mutedText}`}>{t("Du bist auf dem Computer jetzt angemeldet. Dieses Fenster kann geschlossen werden.")}</p>
          </div>
        ) : !user ? (
          <div className={`roche-panel roche-auth grid w-full max-w-5xl gap-10 rounded-[2rem] border p-8 shadow-2xl md:grid-cols-[1.15fr_0.85fr] md:p-14 ${cardBackground}`}>
            <div className="flex flex-col justify-center"><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-blue-700">{t("Roche Wissenstest")}</p><h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">Doing now what patients <span className="font-serif text-blue-700 italic tracking-tight">need next.</span></h1><p className={`mt-6 max-w-lg text-lg leading-8 ${mutedText}`}>{t("Entdecke Roche und lerne die Organisation, ihre Forschung und ihre Arbeitsweise kennen.")}</p><div className={`mt-8 flex gap-3 text-sm font-semibold ${mutedText}`}><span>{availableQuizzes.length} {t("Quizze")}</span></div><div className={`mt-8 flex w-full flex-col items-center gap-4 rounded-2xl border p-3 sm:flex-row sm:items-center sm:p-4 ${darkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}><div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl bg-white p-2 sm:h-40 sm:w-40">{qrCodeUrl ? <Image src={qrCodeUrl} alt={t("QR-Code zur Anmeldung mit dem Handy")} width={160} height={160} unoptimized className="h-full w-full" /> : <span className="px-2 text-center text-xs text-slate-500">{t("QR-Code wird vorbereitet …")}</span>}</div><div className={`min-w-0 text-center text-sm leading-6 sm:text-left ${mutedText}`}><p>{t("Mit dem Handy scannen und anmelden.")}</p>{pairingExpiresAt && <p className="mt-1 text-xs">{t("Gültig bis")} {new Date(pairingExpiresAt).toLocaleTimeString(language === "en" ? "en-US" : "de-DE", { hour: "2-digit", minute: "2-digit" })}{language === "en" ? "" : " Uhr."}</p>}</div></div></div>
            <form className={`flex flex-col justify-center rounded-3xl p-6 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`} onSubmit={handleAuth}><div className={`mb-5 grid grid-cols-2 rounded-xl p-1 ${darkMode ? "bg-slate-700" : "bg-white"}`}><button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "login" ? "bg-blue-700 text-white" : mutedText}`}>{t("Anmelden")}</button><button type="button" onClick={() => { setAuthMode("register"); setAuthError(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${authMode === "register" ? "bg-blue-700 text-white" : mutedText}`}>{t("Registrieren")}</button></div><label htmlFor="name" className="font-semibold">{t("Benutzername")}</label><input id="name" type="text" value={name} onChange={(event) => { setName(event.target.value); setAuthError(""); }} placeholder={t("Maximal 25 Zeichen")} maxLength={25} autoComplete="username" required className={`mt-3 rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} />{authMode === "register" && <><label htmlFor="email" className="mt-4 font-semibold">{t("E-Mail-Adresse")}</label><input id="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setAuthError(""); }} placeholder={t("E-Mail-Adresse eingeben")} autoComplete="email" required className={`mt-3 rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} /></>}<label htmlFor="password" className="mt-4 font-semibold">{t("Passwort")}</label><div className="mt-3 flex gap-2"><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setAuthError(""); }} placeholder={t("Dein Passwort")} autoComplete={authMode === "login" ? "current-password" : "new-password"} required className={`min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className={`rounded-xl border px-3 text-sm font-semibold ${darkMode ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-600"}`} aria-label={showPassword ? t("Passwort verbergen") : t("Passwort anzeigen")}>{showPassword ? t("Verbergen") : t("Anzeigen")}</button></div>{authMode === "register" && <small className={`mt-2 ${mutedText}`}>{t("Mindestens 12 Zeichen, Zahl, Groß-/Kleinbuchstabe und Sonderzeichen.")}</small>}{authError && <p className="mt-3 text-sm font-medium text-red-600">{authError}</p>}<button className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={loading}>{loading ? t("Bitte warten …") : authMode === "login" ? t("Anmelden") : t("Registrieren")} <span aria-hidden="true">→</span></button>{authMode === "login" && <button type="button" onClick={() => { setShowPasswordReset((value) => !value); setResetMessage(""); }} className="mt-3 text-sm font-semibold text-blue-700 underline">{t("Passwort zurücksetzen")}</button>}</form>
            {showPasswordReset && <div className={`mt-4 rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}><h2 className="font-semibold">{resetToken ? t("Neues Passwort setzen") : t("Passwort zurücksetzen")}</h2>{resetToken ? <form className="mt-3" onSubmit={confirmPasswordReset}><label htmlFor="reset-password" className="text-sm font-semibold">{t("Neues Passwort")}</label><input id="reset-password" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="new-password" required className={`mt-2 w-full rounded-xl border px-3 py-2 ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-slate-200 bg-white"}`} /><button type="submit" className="mt-3 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{t("Passwort ändern")}</button></form> : <form className="mt-3" onSubmit={requestPasswordReset}><label htmlFor="reset-email" className="text-sm font-semibold">{t("E-Mail-Adresse")}</label><input id="reset-email" type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder={t("E-Mail-Adresse eingeben")} autoComplete="email" required className={`mt-2 w-full rounded-xl border px-3 py-2 ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-slate-200 bg-white"}`} /><button type="submit" className="mt-3 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{t("Zurücksetzungslink senden")}</button></form>}{resetMessage && <p className={`mt-3 text-sm ${resetMessage.includes("ungültig") || resetMessage.includes("invalid") ? "text-red-600" : "text-emerald-600"}`}>{resetMessage}</p>}</div>}
          </div>
        ) : !started ? (
          <div className={`roche-panel roche-dashboard w-full max-w-5xl rounded-[2rem] border p-8 shadow-2xl md:p-12 ${cardBackground}`}>
            <div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">{t("Dein Roche-Dashboard")}</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">{t("Hallo,")} {user.username}.</h1><p className={`mt-4 max-w-2xl text-lg leading-8 ${mutedText}`}>{t("Wähle ein Quiz aus und entdecke Roche in deinem eigenen Tempo.")}</p><p className={`mt-2 text-xs ${mutedText}`}>{t("Deine Nutzer-ID:")} <code className="break-all">{user.publicId}</code></p></div><button type="button" onClick={() => void logout()} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${darkMode ? "border-slate-600" : "border-slate-200"}`}>{t("Abmelden")}</button></div>
            <section className="mt-10" aria-labelledby="dashboard-quizzes-heading">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="dashboard-quizzes-heading" className="text-xl font-bold">{t("Quizze")}</h2><p className={`mt-1 text-sm ${mutedText}`}>{showDashboardQuizzes ? `${filteredDashboardQuizzes.length} ${t("von")} ${availableQuizzes.length} ${t("Quizze sichtbar")}` : t("Quizkarten ausgeblendet")}</p></div><button type="button" onClick={() => setShowDashboardQuizzes((value) => !value)} aria-expanded={showDashboardQuizzes} className="rounded-xl border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700">{showDashboardQuizzes ? t("Quizkarten ausblenden") : t("Quizkarten einblenden")}</button></div>
              <div className="mt-4"><label htmlFor="dashboard-search" className="sr-only">{t("Quizze im Dashboard suchen")}</label><div className="relative"><input id="dashboard-search" type="search" value={dashboardSearch} onChange={(event) => setDashboardSearch(event.target.value)} placeholder={t("Quiz nach Titel oder Beschreibung suchen …")} className={`w-full rounded-xl border px-4 py-3 pr-24 text-sm outline-none ring-blue-200 transition focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-900"}`} />{dashboardSearch && <button type="button" onClick={() => setDashboardSearch("")} className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold ${darkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100"}`}>{t("Löschen")}</button>}</div><label className={`mt-3 flex items-center gap-2 text-xs ${mutedText}`}>{t("Sortierung")}<select value={dashboardQuizSort} onChange={(event) => setDashboardQuizSort(event.target.value as "createdAt" | "title")} className={`rounded-lg border px-2 py-1 text-xs ${darkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}><option value="createdAt">{t("Neueste")}</option><option value="title">{t("Alphabetisch")}</option></select></label></div>
              {showDashboardQuizzes && (filteredDashboardQuizzes.length > 0 ? <div className="mt-5 grid gap-5 md:grid-cols-2">{filteredDashboardQuizzes.map((quiz) => { const best = bestByQuiz[quiz.id]; return <article key={quiz.id} className={`rounded-2xl border p-6 ${darkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{quiz.isSystem ? t("Bestehendes Quiz") : t("Eigenes Quiz")}</p><h3 className="mt-2 text-2xl font-bold">{quiz.title}</h3><p className={`mt-2 min-h-12 text-sm ${mutedText}`}>{quiz.description}</p><p className={`mt-3 text-sm ${mutedText}`} aria-label={t("Quizbewertung")}>{quiz.ratingCount ? `★ ${quiz.ratingAverage?.toFixed(1)} / 5 (${quiz.ratingCount})` : t("Noch keine Bewertungen")}</p><p className="mt-5 text-sm font-semibold">{t("Dein bester Stand:")} <strong className="text-blue-700">{best ? `${best.correct}/${best.total} · ${formatElapsed(best.elapsedMs)}` : t("Noch kein Ergebnis")}</strong></p><p className={`mt-1 text-sm ${mutedText}`}>{t("Abgeschlossen:")} {best?.attempts ?? 0} {t("Durchläufe")}</p><button type="button" onClick={() => beginQuiz(quiz.id)} className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800">{best ? t("Nochmal spielen") : t("Quiz starten")} <span aria-hidden="true">→</span></button></article>; })}</div> : <p className={`mt-5 rounded-xl border border-dashed p-8 text-center text-sm ${mutedText}`}>{t("Keine passenden Quizze gefunden.")}</p>)}
            </section>
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6"><button type="button" onClick={() => setShowRanking(true)} className="rounded-xl border border-blue-700 px-5 py-3 font-semibold text-blue-700">{t("Rangliste öffnen")}</button>{user.role === "admin" && <button type="button" onClick={() => void loadAdminUsers()} className="text-sm font-semibold text-blue-700 underline">{t("Adminbereich öffnen")}</button>}<button type="button" onClick={() => void deleteAccount()} className="text-sm font-semibold text-red-600 underline">{t("Account löschen")}</button></div>
            {/* Nur Admins sehen Nutzerverwaltung, Quizeditor sowie Import/Export. */}
            {showAdmin && user.role === "admin" && <div className="mt-5 rounded-xl border border-slate-200 p-4 text-left"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{t("Adminbereich")}</p><label className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span>{t("Suche Nutzername/ID")}</span><input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadAdminUsers(event.currentTarget.value); }} placeholder={t("Suchen …")} className="rounded-lg border border-slate-300 px-2 py-1" /><button type="button" onClick={() => void loadAdminUsers()} className="rounded-lg border border-blue-700 px-2 py-1 font-semibold text-blue-700">{t("Suchen")}</button></label></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowAdmin(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{t("Adminbereich schließen")}</button><button type="button" onClick={() => { setEditingQuizId(null); setNewQuizTitle(""); setNewQuizTitleEn(""); setNewQuizDescription(""); setNewQuizDescriptionEn(""); setDraftQuestions([emptyDraftQuestion()]); setShowQuizCreator(true); setQuizCreateError(""); }} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">{t("Neues Quiz erstellen")}</button></div></div><div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="mb-2 text-xs font-semibold">{t("Nutzerverwaltung")}</p>{adminUsers.length === 0 ? <p className="text-xs text-slate-500">{t("Keine passenden Nutzer gefunden.")}</p> : adminUsers.map((adminUser) => <div key={adminUser.id} className="flex flex-wrap items-center gap-2 border-b border-slate-200 py-2 text-xs last:border-0"><span className="min-w-0 flex-1 font-semibold">{adminUser.username}<span className="ml-2 font-normal text-slate-500">{adminUser.publicId}</span></span><span className="text-slate-500">{adminUser.role}</span><button type="button" onClick={() => void changeUserRole(adminUser.id, adminUser.role === "admin" ? "user" : "admin")} className="font-semibold text-blue-700 underline">{adminUser.role === "admin" ? t("Zu Nutzer machen") : t("Zum Admin machen")}</button><button type="button" onClick={() => void deleteAdminUser(adminUser.id)} className="font-semibold text-red-600 underline">{t("Löschen")}</button></div>)}</div><div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="mb-2 text-xs font-semibold">{t("Quizverwaltung")}</p>{availableQuizzes.map((quiz) => <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 py-2 text-xs last:border-0"><span className="min-w-0 flex-1 truncate font-semibold">{quiz.title}{quiz.isSystem && <span className="ml-2 text-[10px] font-normal uppercase text-slate-500">{t("System")}</span>}</span><span className="text-slate-500">{quiz.questions.length} {t("Fragen")}</span><button type="button" onClick={() => void editQuiz(quiz)} className="font-semibold text-blue-700 underline">{t("Bearbeiten")}</button><button type="button" onClick={() => void deleteCustomQuiz(quiz.id)} className="font-semibold text-red-600 underline">{t("Löschen")}</button></div>)}</div><div className="mt-4 rounded-lg border border-slate-200 p-3"><p className="mb-2 flex items-center gap-2 text-xs font-semibold">{t("Rangliste exportieren")} <span title={t("Wähle ein Quiz und lade die globale Rangliste als XLSX oder PDF herunter. Enthalten sind Name, Versuche, Zeit, richtige Antworten und Prozent.")} aria-label={t("Informationen zum Ranglistenexport")} className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-400 text-[10px]">?</span></p><div className="flex flex-wrap gap-2"><select value={exportQuizId} onChange={(event) => setExportQuizId(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">{availableQuizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select><button type="button" onClick={() => void downloadLeaderboard("xlsx")} disabled={exportingFormat !== null} className="rounded-lg border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-700">{exportingFormat === "xlsx" ? t("Exportiert …") : "XLSX"}</button><button type="button" onClick={() => void downloadLeaderboard("pdf")} disabled={exportingFormat !== null} className="rounded-lg border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-700">{exportingFormat === "pdf" ? t("Exportiert …") : "PDF"}</button></div></div><form onSubmit={importQuiz} className="mt-4 rounded-lg border border-slate-200 p-3"><p className="flex items-center gap-2 text-xs font-semibold">{t("Quiz aus XLSX importieren")} <span title={t("Die Datei braucht die Blätter Quiz und Fragen. Fragen-Spalten: Typ, Frage, Antwort A-D, Richtige Antwort, Erwartete Antwort, Erwartete Zahl, Einheit.")} aria-label={t("Informationen zum XLSX-Import")} className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-400 text-[10px]">?</span></p><p className={`mt-1 text-xs ${mutedText}`}>{t("Tabellenblätter „Quiz“ und „Fragen“ mit den Spalten Typ, Frage, Antwort A-D, Richtige Antwort, Erwartete Antwort, Erwartete Zahl, Einheit.")}</p><div className="mt-2 flex flex-wrap gap-2"><input type="file" accept=".xlsx" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} className="min-w-0 flex-1 text-xs" /><button type="submit" disabled={importingQuiz} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">{importingQuiz ? t("Importiert …") : t("Importieren")}</button></div>{importError && <p className="mt-2 text-xs font-medium text-red-600">{importError}</p>}</form><div className="mt-4 rounded-lg border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold">{t("Benutzer")}</p>{adminUsers.filter((adminUser) => adminUser.role === "user").map((adminUser) => <div key={adminUser.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs last:border-0"><span className="min-w-0 flex-1 truncate">{adminUser.username}</span><button type="button" onClick={() => void changeUserRole(adminUser.id, "admin")} className="text-blue-700 underline">{t("Admin machen")}</button><button type="button" onClick={() => void deleteAdminUser(adminUser.id)} className="text-red-600 underline">{t("Löschen")}</button></div>)}</div><div className="mt-4 rounded-lg border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold">{t("Administratoren")}</p>{adminUsers.filter((adminUser) => adminUser.role === "admin").map((adminUser) => <div key={adminUser.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs last:border-0"><span className="min-w-0 flex-1 truncate">{adminUser.username}{adminUser.id === user.id && ` (${t("du")})`}</span>{adminUser.id !== user.id && <><button type="button" onClick={() => void changeUserRole(adminUser.id, "user")} className="text-blue-700 underline">{t("Adminrechte entziehen")}</button><button type="button" onClick={() => void deleteAdminUser(adminUser.id)} className="text-red-600 underline">{t("Löschen")}</button></>}</div>)}</div>{showQuizCreator && <form onSubmit={saveNewQuiz} className="mt-5 border-t border-slate-200 pt-5"><h3 className="text-lg font-bold">{editingQuizId ? t("Quiz bearbeiten") : t("Neues Quiz erstellen")}</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><input value={newQuizTitle} onChange={(event) => setNewQuizTitle(event.target.value)} maxLength={100} placeholder={t("Titel")} required className="rounded-lg border border-slate-200 px-3 py-2" /><input value={newQuizTitleEn} onChange={(event) => setNewQuizTitleEn(event.target.value)} maxLength={100} placeholder={t("Englischer Titel")} className="rounded-lg border border-slate-200 px-3 py-2" /><input value={newQuizDescription} onChange={(event) => setNewQuizDescription(event.target.value)} maxLength={300} placeholder={t("Beschreibung")} required className="rounded-lg border border-slate-200 px-3 py-2" /><input value={newQuizDescriptionEn} onChange={(event) => setNewQuizDescriptionEn(event.target.value)} maxLength={300} placeholder={t("Englische Beschreibung")} className="rounded-lg border border-slate-200 px-3 py-2" /></div><div className="mt-4 space-y-4">{draftQuestions.map((draft, questionIndex) => <fieldset key={questionIndex} className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">{t("Frage")} {questionIndex + 1}</legend><div className="grid gap-3 md:grid-cols-[1fr_180px]"><input value={draft.question} onChange={(event) => updateDraftQuestion(questionIndex, { question: event.target.value })} placeholder={t("Fragetext")} required className="rounded-lg border border-slate-200 px-3 py-2" /><input value={draft.questionEn} onChange={(event) => updateDraftQuestion(questionIndex, { questionEn: event.target.value })} placeholder={t("Englischer Fragetext")} className="rounded-lg border border-slate-200 px-3 py-2" /><select value={draft.kind} onChange={(event) => updateDraftQuestion(questionIndex, { kind: event.target.value as QuestionKind })} className="rounded-lg border border-slate-200 px-3 py-2"><option value="multiple-choice">{t("Multiple Choice")}</option><option value="text">{t("Lückentext")}</option><option value="number">{t("Zahleneingabe")}</option><option value="true-false">{t("Wahr/Falsch")}</option></select></div>{draft.kind === "multiple-choice" && <div className="mt-3 grid gap-2 sm:grid-cols-2">{draft.answers.map((answer, answerIndex) => <label key={answerIndex} className="flex items-center gap-2 text-sm"><input type="radio" name={`correct-${questionIndex}`} checked={draft.correctIndex === answerIndex} onChange={() => updateDraftQuestion(questionIndex, { correctIndex: answerIndex })} /><input value={answer} onChange={(event) => updateDraftAnswer(questionIndex, answerIndex, event.target.value)} placeholder={`${t("Antwort")} ${answerIndex + 1}`} required className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2" /><input value={draft.answersEn[answerIndex]} onChange={(event) => updateDraftAnswer(questionIndex, answerIndex, event.target.value, "en")} placeholder={`${t("Englische Antwort")} ${answerIndex + 1}`} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2" /></label>)}</div>}{draft.kind === "text" && <div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={draft.expectedAnswer} onChange={(event) => updateDraftQuestion(questionIndex, { expectedAnswer: event.target.value })} placeholder={t("Erwartete Antwort")} required className="w-full rounded-lg border border-slate-200 px-3 py-2" /><input value={draft.expectedAnswerEn} onChange={(event) => updateDraftQuestion(questionIndex, { expectedAnswerEn: event.target.value })} placeholder={t("Englische erwartete Antwort")} className="w-full rounded-lg border border-slate-200 px-3 py-2" /></div>}{draft.kind === "true-false" && <select value={String(draft.expectedBoolean)} onChange={(event) => updateDraftQuestion(questionIndex, { expectedBoolean: event.target.value === "true" })} className="mt-3 rounded-lg border border-slate-200 px-3 py-2"><option value="true">{t("Richtig: Wahr")}</option><option value="false">{t("Richtig: Falsch")}</option></select>}{draft.kind === "number" && <div className="mt-3 grid gap-2 sm:grid-cols-2"><input type="number" value={draft.expectedNumber} onChange={(event) => updateDraftQuestion(questionIndex, { expectedNumber: event.target.value })} placeholder={t("Erwartete Zahl")} required className="rounded-lg border border-slate-200 px-3 py-2" /><input value={draft.unit} onChange={(event) => updateDraftQuestion(questionIndex, { unit: event.target.value })} placeholder={t("Einheit, z. B. Tage")} required className="rounded-lg border border-slate-200 px-3 py-2" /><input value={draft.unitEn} onChange={(event) => updateDraftQuestion(questionIndex, { unitEn: event.target.value })} placeholder={t("Englische Einheit")} className="rounded-lg border border-slate-200 px-3 py-2" /></div>}<button type="button" onClick={() => setDraftQuestions((previous) => previous.filter((_, index) => index !== questionIndex))} className="mt-3 ml-2 inline-block text-xs font-semibold text-red-600 underline" disabled={draftQuestions.length === 1}>{t("Frage entfernen")}</button></fieldset>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setDraftQuestions((previous) => [...previous, emptyDraftQuestion()])} className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-700">{t("Frage hinzufügen")}</button><button type="submit" disabled={quizCreating} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{quizCreating ? t("Speichert …") : t("Quiz speichern")}</button><button type="button" onClick={() => { setShowQuizCreator(false); setEditingQuizId(null); setQuizCreateError(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{t("Abbrechen")}</button></div>{quizCreateError && <p className="mt-3 text-sm font-medium text-red-600">{quizCreateError}</p>}</form>}</div>}
            {authError && <p className="mt-4 text-sm font-medium text-red-600">{authError}</p>}
          </div>
        ) : finished ? (
          <div className={`roche-panel roche-result w-full max-w-2xl rounded-[2rem] border p-8 text-center shadow-2xl md:p-14 ${cardBackground}`}><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">{activeQuiz.title} {t("abgeschlossen")}</p><div className="my-8"><strong className="text-7xl font-bold text-blue-700">{score}<small className={`text-3xl ${mutedText}`}> / {questions.length}</small></strong><span className={`mt-2 block ${mutedText}`}>{t("richtige Antworten")}</span></div><h1 className="text-3xl font-bold">{t("Danke,")} {name.trim()}!</h1><p className={`mt-3 ${mutedText}`}>{t("Zeit:")} {formatElapsed(elapsedMs)}</p>{savedResult && savedResult.rank && <p className="mt-4 text-lg font-semibold text-blue-700">{t("Dein Rang:")} {savedResult.rank}. {t("Platz")}</p>}{authError && <p className="mt-4 text-sm font-medium text-red-600">{authError}</p>}<div className={`my-8 rounded-2xl border p-5 text-left ${darkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}><h2 className="text-lg font-bold">{t("Quiz bewerten")}</h2><p className={`mt-1 text-sm ${mutedText}`}>{ratingSummary?.ratingCount ? `${t("Durchschnitt:")} ${ratingSummary.ratingAverage.toFixed(1)} / 5 ${t("aus")} ${ratingSummary.ratingCount} ${t("Bewertungen")}` : t("Noch keine Bewertungen")}</p><div className="mt-3 flex flex-wrap items-center gap-1" role="radiogroup" aria-label={t("Bewertung von 1 bis 5 Sternen")}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRatingStars(star)} aria-label={`${star} Sterne`} aria-checked={ratingStars === star} role="radio" className={`text-3xl ${ratingStars >= star ? "text-yellow-400" : "text-slate-300"}`}>★</button>)}</div><textarea value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} maxLength={500} rows={3} placeholder={t("Optionaler Kommentar")} className={`mt-3 w-full resize-y rounded-xl border px-3 py-2 text-sm ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-slate-200 bg-white text-slate-900"}`} /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className={`text-xs ${mutedText}`}>{ratingComment.length}/500 {t("Zeichen")}</span><button type="button" onClick={() => void saveRating()} disabled={ratingSaving || !ratingStars} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{ratingSaving ? t("Speichert …") : myRating ? t("Bewertung aktualisieren") : t("Bewertung speichern")}</button></div>{ratingError && <p className="mt-2 text-sm text-red-600">{ratingError}</p>}<div className="mt-4 grid grid-cols-5 gap-1 text-center text-xs">{[5, 4, 3, 2, 1].map((star) => <button key={star} type="button" onClick={() => { const nextFilter = ratingFilter === star ? null : star; setRatingFilter(nextFilter); void loadRatings(activeQuizId, nextFilter); }} className={`rounded-lg border px-1 py-2 ${ratingFilter === star ? "border-blue-700 bg-blue-50" : "border-slate-200"}`}><span className="block">{star}★</span><span className="block">{ratingSummary?.ratingDistribution[star as 1 | 2 | 3 | 4 | 5] ?? 0}</span></button>)}</div>{ratings.length > 0 && <ul className="mt-4 space-y-2">{ratings.map((rating) => <li key={`${rating.username}-${rating.updatedAt}`} className="rounded-xl border border-slate-200 p-3 text-sm"><span className="font-semibold">{rating.username}</span><span className={`ml-2 ${mutedText}`}>{"★".repeat(rating.stars)}</span>{rating.comment && <p className={`mt-1 ${mutedText}`}>{rating.comment}</p>}</li>)}</ul>}</div><div className="my-8 flex justify-center gap-2" aria-label={`${score} ${t("von")} ${questions.length} ${t("Fragen richtig")}`}>{questions.map((item, index) => <span key={item.id} className={`h-3 w-8 rounded-full ${index < score ? "bg-blue-700" : darkMode ? "bg-slate-700" : "bg-slate-200"}`} />)}</div><div className="flex flex-wrap justify-center gap-3"><button className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800" onClick={() => beginQuiz(activeQuizId)}>{t("Nochmal starten")} <span>↻</span></button><button type="button" onClick={backToDashboard} className={`rounded-xl border px-6 py-3 font-semibold ${darkMode ? "border-slate-600" : "border-slate-200"}`}>{t("Zum Dashboard")}</button><button type="button" onClick={() => { setRankingQuizId(activeQuizId); setShowRanking(true); }} className="rounded-xl border border-blue-700 px-6 py-3 font-semibold text-blue-700">{t("Rangliste")}</button></div></div>
        ) : (
          <div className={`roche-panel roche-quiz w-full max-w-4xl rounded-[2rem] border p-8 shadow-2xl md:p-14 ${cardBackground}`}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{activeQuiz.title} · {name.trim()}</p><h1 className="mt-3 text-3xl font-bold md:text-5xl">{t("Deine nächste Frage")}</h1></div><div className="text-right"><strong className="text-4xl text-blue-700">{String(current + 1).padStart(2, "0")}</strong><span className={`block text-sm ${mutedText}`}>/ {String(questions.length).padStart(2, "0")}</span><span className={`mt-2 block text-sm font-semibold ${mutedText}`} aria-label={t("Vergangene Zeit")}>{t("Zeit")} {formatElapsed(elapsedMs)}</span></div></div>
            <div className={`mt-8 h-2 overflow-hidden rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}><span className="block h-full rounded-full bg-blue-700 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
            {question && <><p className="mt-10 text-2xl font-semibold leading-relaxed md:text-3xl">{question.question}</p>{showFoundingVideo && <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg"><video className="aspect-video w-full" controls preload="metadata" title={t("Screenrecording zur Gründung von Roche")}><source src="/Bildschirmaufnahme%202026-10-13%20104014.mp4" type="video/mp4" />{t("Dein Browser unterstützt dieses Videoformat nicht.")}</video></div>}
              {/* Je nach kind wird genau das passende Antwortformular gerendert. */}
              {question.kind === "multiple-choice" ? <div className="mt-8 grid gap-4 md:grid-cols-2" role="group" aria-label={t("Antwortmöglichkeiten")}>{question.answers.map((answer, index) => <button key={`${answer.text}-${index}`} type="button" disabled={Boolean(feedback)} className={`flex min-h-20 items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left font-medium transition hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 ${answerColors[index]} ${isDevMode && answer.correct ? "font-extrabold" : ""}`} onClick={() => chooseAnswer(answer)}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-slate-700">{answerLetters[index]}</span><span>{answer.text}</span></button>)}</div> : question.kind === "true-false" ? <div className="mt-8 grid gap-4 sm:grid-cols-2" role="group" aria-label={t("Wahr oder Falsch")}><button type="button" disabled={Boolean(feedback)} onClick={() => chooseBooleanAnswer(true)} className="min-h-20 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-lg font-semibold text-emerald-900 disabled:opacity-60">{t("Wahr")}</button><button type="button" disabled={Boolean(feedback)} onClick={() => chooseBooleanAnswer(false)} className="min-h-20 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-900 disabled:opacity-60">{t("Falsch")}</button></div> : <form onSubmit={submitFreeAnswer} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"><input type={question.kind === "number" ? "number" : "text"} inputMode={question.kind === "number" ? "numeric" : "text"} value={answerDraft} onChange={(event) => { setAnswerDraft(event.target.value); setAnswerError(""); }} placeholder={question.placeholder} disabled={Boolean(feedback)} className={`min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none ring-blue-200 focus:ring-4 ${darkMode ? "border-slate-600 bg-slate-700 text-white" : "border-slate-200 bg-white text-slate-900"}`} aria-label={t("Antwort eingeben")} /><button type="submit" disabled={Boolean(feedback)} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{t("Prüfen")}</button></form>}
              {answerError && <p className="mt-3 text-sm font-medium text-red-600">{answerError}</p>}
              {/* Feedback wird erst nach der Antwort eingeblendet und steuert den Weiter-Button. */}
              {feedback && <div className={`mt-8 rounded-2xl border p-5 ${feedback.correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`} role="status"><p className="font-bold">{feedback.correct ? t("Richtig!") : t("Noch nicht richtig.")}</p>{!feedback.correct && <p className="mt-1 text-sm">{t("Richtige Antwort:")} {feedback.expected}</p>}<button type="button" onClick={continueQuiz} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">{current === questions.length - 1 ? t("Ergebnis anzeigen") : t("Weiter")} <span aria-hidden="true">→</span></button></div>}
              <div className={`mt-8 flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between ${darkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}><span>{feedback ? t("Prüfe dein Feedback und fahre dann fort.") : question.kind === "multiple-choice" ? t("Wähle eine Antwort aus.") : question.kind === "true-false" ? t("Wähle Wahr oder Falsch aus.") : t("Gib deine Antwort ein und prüfe sie.")}</span><div className="flex items-center gap-4">{current > 0 && <button type="button" onClick={previousQuestion} className="font-semibold text-blue-700 transition hover:text-blue-900">← {t("Vorherige Frage")}</button>}<button type="button" onClick={backToDashboard} className="font-semibold text-blue-700 transition hover:text-blue-900">← {t("Dashboard")}</button></div></div>
            </>}
          </div>
        )}
      </section>

      <footer className={`roche-footer relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-6 text-xs ${mutedText} lg:px-10`}><span>{t("Roche Wissenstest")}</span><span>Doing now what patients need next.</span><div className="flex items-center gap-4"><button type="button" onClick={() => setSoundEnabled((value) => !value)} className="font-semibold transition hover:text-blue-700" aria-label={soundEnabled ? t("Sound ausschalten") : t("Sound einschalten")}>{soundEnabled ? "🔊 " + t("Sound") : "🔇 " + t("Sound")}</button><button type="button" onClick={() => setDarkMode((value) => !value)} className="font-semibold transition hover:text-blue-700" aria-label={darkMode ? t("Light mode aktivieren") : t("Dark mode aktivieren")}>{darkMode ? "☀ " + t("Light mode") : "☾ " + t("Night mode")}</button></div></footer>
    </main>
  );
}
