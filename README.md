# Franskaprov kapitel 4

En liten React + TypeScript-app för lokal övning inför ett franskaprov om kapitel 4.

## Kom igång

```bash
npm install
npm run dev
```

Bygg appen:

```bash
npm run build
```

Kör tester:

```bash
npm test
```

## GitHub Pages

Projektet är förberett för automatisk deploy till GitHub Pages via GitHub Actions i
[.github/workflows/deploy-pages.yml](/Users/erik/Hobbyspace/french-quiz/.github/workflows/deploy-pages.yml).

Gör så här:

- Aktivera GitHub Pages i repots inställningar: `Settings` → `Pages` → `Source = GitHub Actions`
- Push till `main` för att trigga deployen
- Sajten blir tillgänglig på `https://<username>.github.io/<repo-name>/`

Vite försöker läsa repo-namnet automatiskt från GitHub Actions-miljön via `GITHUB_REPOSITORY`, så samma workflow fungerar utan egna miljövariabler. Lokala byggen fortsätter att använda rot-sökvägen `/`.

## Lägg till fler glosor och frågor

Allt innehåll ligger i [src/data/chapter4.ts](/Users/erik/Hobbyspace/french-quiz/src/data/chapter4.ts).

För nya gloskort, lägg till ett objekt i `flashcards`:

```ts
{
  id: "time-midi",
  category: "Tid",
  french: "à midi",
  swedish: "vid middagstid",
}
```

För nya quizfrågor, lägg till ett objekt i `quizQuestions`:

```ts
{
  id: "quiz-midi",
  category: "Tid",
  type: "multiple-choice",
  prompt: "Vad betyder 'à midi'?",
  answer: "vid middagstid",
  options: ["vid middagstid", "vid midnatt", "imorgon"],
  explanation: "Tänk på att 'midi' är mitt på dagen."
}
```

För fler textövningar kan du utöka:

- `faireExercises` för verbet `faire`
- `sentenceExercises` för fyll-i-luckan
- `translationExercises` för översättning

Varje objekt behöver ett unikt `id`, en tydlig `category`, en `prompt` och ett `answer`. Om du vill ge extra stöd efter svaret kan du fylla i `explanation`.
# french-quiz
