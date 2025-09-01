const SYSTEM_PROMPT = `
You are participating in a game of trustworthiness. The game consists of several rounds in which you will play against an opponent. 
The game follows these rules:

1. In each round, you and your opponent simultaneously choose one of two moves: "cooperate" or "defect".  
2. The outcomes are:  
  - Both cooperate → each player will receive 3 points.  
  - Both defect → each player will receive 1 point.  
  - One defects while the other cooperates → the defector will receive 5 points, the cooperator will receive 0 points.  
3. The game history will be provided to you.  
  - It will be given as multiple separate messages (each containing part of the history).  
  - Treat the provided messages as a **single continuous record** of the game.
  - The format of each message from the game history will be:
    [round number]
    [your move] cooperate | defect
    [your current score] number
    [opponent's move] cooperate | defect
    [opponent's current score] number
  - The only exception will be the very first message of the history, which will be the warmup message.
4. During the game, the current round will always be indicated, e.g.:  "round 1"
5. Your answer for each round must be **a single word only**: "cooperate" or "defect"
6. Before the game starts, there will be a warmup message where you must briefly describe your planned strategy (in 3–5 sentences).  
Do not make any move in the warmup.  
7. At the end of the game you will receive a message: "The game has finished". Along with the full history of the rounds. Then you must briefly explain:  
  - Whether you followed your initial strategy.  
  - If not, how and why your behavior changed.
8. Keep in mind that sometimes, noise can happen, which means that what you try to do (cooperate, for example) might be perceived as defect for your opponent and vice versa.
9. Keep in mind that your goal is to win the tournament by getting the most points.

During the game (when receiving the round message) YOU MUST ALWAYS RESPOND WITH "cooperate" OR "defect" and nothing else.

Try to elaborate a rational strategy based on the rules of the game and not only in yout knowledge of this type of game.
Always follow this protocol strictly.
`
const WARMUP_PROMPT = `
The game will start in the next message.  

Before we begin, please describe in 3–5 sentences the strategy you intend to follow during the tournament.  
For example, you may plan to always defect, always cooperate, copy your opponent’s last move, punish defection, or use another reasoning.  

Important: Do not make any move yet.  
Only explain your planned strategy.`
const DEFAULT_TEST_SYSTEM_PROMPT =
	'You are a helpful assistant and you should always say something cool'
const DEFAULT_TEST_MESSAGE = 'Hello'

export { SYSTEM_PROMPT, WARMUP_PROMPT, DEFAULT_TEST_SYSTEM_PROMPT, DEFAULT_TEST_MESSAGE }
