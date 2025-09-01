export const REPORT_CONTENT_WITH_PLACEHOLDERS = `
## Game:  {{gameId}}

## Models
- Model A: {{modelA}}
- Model B: {{modelB}}

## Game Settings
- Rounds: {{rounds}}
- Noise Level: {{noiseLevel}}

## Game Data
- Model A Moves: {{modelAMoves}}
- Model B Moves: {{modelBMoves}}
- Model A Points: {{modelAPoints}}
- Model B Points: {{modelBPoints}}

## Model A - {{modelA}} - Initial Strategy
{{modelAInitialStrategy}}

## Model A - {{modelA}} - Final Strategy
{{modelAFinalStrategy}}

## Model B - {{modelB}} - Initial Strategy
{{modelBInitialStrategy}}

## Model B - {{modelB}} - Final Strategy
{{modelBFinalStrategy}}

![Score Chart]({{scoreChartFile}})
`
