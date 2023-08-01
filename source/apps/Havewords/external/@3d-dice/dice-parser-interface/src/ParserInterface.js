import { DiceRoller } from "@3d-dice/dice-roller-parser"

let externalCount = 0

class ParserInterface {
	constructor(options = {}){
		this.rollsAsFloats = []
		this.dieGroups = []
		this.parsedNotation = null
		this.finalResults = null
    this.targetRollsCritSuccess = options?.targetRollsCritSuccess || options?.targetRollsCrit || false,
    this.targetRollsCritFailure = options?.targetRollsCritFailure || options?.targetRollsCrit || false,
		this.initParser()
	}

	//TODO: toggle targetRollsCritSuccess and targetRollsCritFailure externally

	// Set up the parser with our custom random function
	initParser(){
		this.rollParser = new DiceRoller((rolls = this.rollsAsFloats) => {
			if(rolls.length > 0) {
				return rolls[externalCount++]
			} else {
				console.warn("No result was passed to the dice-roller-parser. Using fallback Math.random")
				return Math.random()
			}
		})
	}

	parseNotation(notation) {
		// clean out the gunk
		this.clear()
		// parse the raw string notation
		notation = notation.replace(/d00/,'d%') // convert d00 to d%
		this.parsedNotation = this.rollParser.parse(notation)

		// create a new object of just dice needed for rolling
		const findDie = (obj) => {
			// capture 'fate' die.type
			const sides = obj.die.value || obj.die.type
			this.dieGroups.push({
				qty: obj.count.value,
				sides,
				mods: obj.mods
			})
		}

		this.recursiveSearch(this.parsedNotation, 'die', [], findDie)

		return this.dieGroups
	}

	rollNotation(notationObject) {
		this.finalResults = this.rollParser.rollParsed(notationObject)
		return this.finalResults
	}

	clear(){
		externalCount = 0
		this.rollsAsFloats = []
		this.dieGroups = []
		this.parsedNotation = null
		this.finalResults = null
	}

	// make this static for use by other systems?
	recursiveSearch(obj, searchKey, results = [], callback) {
		const r = results;
		Object.keys(obj).forEach(key => {
			const value = obj[key];
			// if(key === searchKey && typeof value !== 'object'){
			if(key === searchKey){
				r.push(value);
				if(callback && typeof callback === 'function') {
					callback(obj)
				}
			} else if(value && typeof value === 'object'){
				this.recursiveSearch(value, searchKey, r, callback);
			}
		});
		return r;
	}
	incrementId(key) {
		key = key.toString()
		let splitKey = key.split(".")
		if(splitKey[1]){
			splitKey[1] = parseInt(splitKey[1]) + 1
		} else {
			splitKey[1] = 1
		}
		return splitKey[0] + "." + splitKey[1]
	}

	// TODO: this needs to return a object of rolls that need to be rolled again, 
	handleRerolls(rollResults = []) {
		const rerolls = []
		rollResults.forEach((group, groupId) => {
			// check for 'mods' - might need to reroll when encountered
			if(group.mods?.length > 0){
				const successTest = (roll, mod, target) => {
					switch (mod) {
						case ">":
							return roll >= target;
						case "<":
							return roll <= target;
						case "=":
						default:
							return roll == target;
					}
				}
				const rollIds = group.rolls.map(roll => roll.rollId)
				const alreadyReRolled = (id) => {
					// if the incremented id exists in the group then this die has been processed previously
					const increment = this.incrementId(id)
					return rollIds.includes(increment)
				}
				group.mods.forEach(mod => {
					// TODO: handle each type of mod that would trigger a reroll
					const rollsCopy = {...group.rolls}
					switch(mod.type){
						case "explode":
						case "compound":
							// for compound: the additional rolls for each dice are added together as a single "roll" (calculated by the parser)
							Object.entries(rollsCopy).forEach(([key, die]) => {
								const max = die.sides
								const target = mod.target?.value?.value || max
								const op = mod.target?.mod || '>'
								// TODO: pass back die theme
								// TODO: destructure die object and replace rollId - keep all other properties as there may be more in the future (such as scale)
								if(successTest(die.value, op, target) && !alreadyReRolled(die.rollId)) {
									rerolls.push({
										groupId,
										rollId: this.incrementId(die.rollId),
										sides: die.sides,
										qty: 1
									})
								}
							})
							break;
						case "penetrate":
							// if die = max then it explodes, but -1 on explode result (calculated by the parser)
							// ! Turning this into a future feature or option "HackMaster: true" - option for plugin or override
							// if die is d20 and explodes then it's followed by a d6
							// if die is d100 and explodes then it's followed by a d20
							// this gets complicated for d100 and d20 rerolls
							// d20 explode triggers a d6. The parser will parse extra die value as a d20 and not a d6. So the value as float is incorrect. Same for d100. Need to do some extra math. Would want to convert the value here, perhaps with a flag on the reroll
							// TODO: explosions beyond the first are being dropped, probably because their value has been decremented by 1 and no longer register as meeting the explode success criteria
							Object.entries(rollsCopy).forEach(([key, die]) => {
								const max = die.sides
								const target = mod.target?.value?.value || max
								const op = mod.target?.mod || '='
								if(successTest(die.value, op, target) && !alreadyReRolled(die.rollId)) {
									rerolls.push({
										groupId,
										rollId: this.incrementId(die.rollId),
										// sides: die.sides === 100 ? 20 : die.sides === 20 ? 6 : die.sides,
										sides: die.sides,
										qty: 1
									})
								}
							})
							break;
						case "reroll":
							Object.entries(rollsCopy).forEach(([key, die]) => {
								const max = die.sides
								if(successTest(die.value, mod.target.mod, mod.target.value.value)  && !alreadyReRolled(die.rollId)) {
									rerolls.push({
										groupId,
										rollId: this.incrementId(die.rollId),
										sides: die.sides,
										qty: 1
									})
								}
							})
							break;
						case "rerollOnce":
							Object.entries(rollsCopy).forEach(([key, die]) => {
								const target = mod.target?.value?.value
								const op = mod.target.mod
								if(successTest(die.value, op, target)  && !alreadyReRolled(die.rollId) && !die.rollId.toString().includes(".")) {
									rerolls.push({
										groupId,
										rollId: this.incrementId(die.rollId),
										sides: die.sides,
										qty: 1
									})
								}
							})
							break;
					}
				}) // end mods forEach
			}
		}) // end results forEach

		return rerolls
	}

  handleTargetCritSuccess(finalResults = []){
    finalResults.rolls.forEach(roll => {
      if(roll.successes >= 1 && roll.critical === "success") {
        roll.successes += 1
        finalResults.value += 1
      }
    })
	}
  handleTargetCritFailure(finalResults = []){
    finalResults.rolls.forEach(roll => {
      if(roll.failures >= 1 && roll.critical === "failure"){
        roll.failures += 1
        finalResults.value -=1
      }
    })
	}

	parseFinalResults(rollResults = []) {
		// do the final parse
		let allRolls = this.recursiveSearch(rollResults, "rolls")
		const rolls = allRolls.length? allRolls : [rollResults]
		rolls.forEach(roll => {
			return Object.entries(roll).forEach(([key, die]) => {
				try{
					let sides = die.sides
					// convert string names back to intigers needed by DRP
					const diceNotation = /[dD]\d+/i
					if(typeof sides === "string" && sides.match(diceNotation)){
						sides = parseInt(die.sides.substring(1))
					}
					if(sides){
						if(sides === 'fate') {
							this.rollsAsFloats.push((die.value + 2) * .25)
						} else {
							this.rollsAsFloats.push((die.value - 1)/sides)
						}
					}
				} catch {
					console.error(`This object is not a properly formatted roll object.`, die)
					throw new Error(`Unable to parse final results`)
				}
			})
		})

		const finalResults = this.rollParser.rollParsed(this.parsedNotation)

		// if targets can crit success then give them another success
		if(this.targetRollsCritSuccess && finalResults.success !== null){
      this.handleTargetCritSuccess(finalResults)
    }

		// if targets can crit fail then give them another failure
    if(this.targetRollsCritFailure && finalResults.success !== null){
      this.handleTargetCritFailure(finalResults)
    }

		// save a reference to the final results
		this.finalResults = finalResults
	
		// after parse clear out global variables
		externalCount = 0
		this.rollsAsFloats = []

		return finalResults
	}
}

export default ParserInterface