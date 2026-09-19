# Homework question sheets

Add question sheets to the homework feature so coaches can ask questions and parents/players answer them online, alongside the existing photo/video proof.

## Question types

- **Multiple choice** - coach writes the question and 2-6 answer options, ticks the correct one (optional). Player picks one.
- **Tick all that apply** - same, but more than one correct option allowed.
- **Written answer** - short or long text box.
- **True or false** - quick two-button answer.
- **Number** - e.g. "How many keepy-uppies did you get?"

Each question can be marked as required, and the coach can leave the "correct answer" blank for opinion questions.

## Coach experience (Dashboard > Homework)

- When setting or editing homework, a "Questions" builder appears under the task details: add a question, choose its type, type the prompt, add options, mark the correct answer, reorder or delete.
- A task can have questions, media proof, or both. Existing tasks are untouched and keep working.
- Opening a task shows each child's answers next to their proof, with auto-marked questions shown as correct/incorrect and a score (e.g. 4/5). Written answers are shown in full for the coach to read and comment on as they already can.

## Parent experience (Hub > Homework and My Family)

- A task with questions shows an answer sheet inline: the questions in order, with the right input for each type.
- Required questions must be answered before submitting; the sheet saves together with the optional note and photo/video in one "Submit homework" action.
- After submitting, the completed card shows their answers, which auto-marked ones were right, and the score. Coach likes, comments and Star of the Week work exactly as now.

## Technical notes

- New tables: `homework_questions` (task_id, position, type, prompt, options jsonb, correct_answers jsonb, required) and `homework_answers` (submission_id, question_id, answer jsonb, is_correct nullable). Both with GRANTs and RLS mirroring the existing homework tables: team members read questions for their team's tasks, parents write only their own answers, coaches/admins read all and manage questions.
- Auto-marking happens client-side on submit for choice/true-false/number types; correct answers are only readable by coaches/admins so answers can't be peeked at (questions are returned to parents without the `correct_answers` column via a dedicated view or column-level policy).
- Notification copy for new homework mentions the number of questions when a sheet is attached; no new notification channels.
- UI follows the existing black/gold homework styling in `HomeworkManager.tsx` and `HomeworkTab.tsx`.
