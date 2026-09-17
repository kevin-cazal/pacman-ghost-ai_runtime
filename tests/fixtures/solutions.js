// Code élève de référence, au format de l'atelier : une seule fonction `ghost`,
// des globales fournies par le jeu (me, pacman, map, game), et la globale
// `state` pour l'humeur. Chaque fixture est ce qu'un élève a dans son éditeur
// à une étape donnée du sujet.

export const FIXTURES = {
  template: `function ghost()
  return nil
end
`,

  // Partie 1, étape 2.
  canGoLeft: `function ghost()
  canGoLeft = not map.isWall(me.X - 1, me.Y)
  if canGoLeft then
    return 'left'
  end
  return nil
end
`,

  // Partie 1, étape 7 : l'axe où l'écart est le plus grand d'abord.
  chase: `function ghost()
  canGoLeft = not map.isWall(me.X - 1, me.Y)
  canGoRight = not map.isWall(me.X + 1, me.Y)
  canGoUp = not map.isWall(me.X, me.Y - 1)
  canGoDown = not map.isWall(me.X, me.Y + 1)
  distanceX = pacman.X - me.X
  distanceY = pacman.Y - me.Y

  if math.abs(distanceX) > math.abs(distanceY) then
    if canGoLeft and distanceX < 0 then return 'left' end
    if canGoRight and distanceX > 0 then return 'right' end
    if canGoUp and distanceY < 0 then return 'up' end
    if canGoDown and distanceY > 0 then return 'down' end
  else
    if canGoUp and distanceY < 0 then return 'up' end
    if canGoDown and distanceY > 0 then return 'down' end
    if canGoLeft and distanceX < 0 then return 'left' end
    if canGoRight and distanceX > 0 then return 'right' end
  end
  return nil
end
`,

  // Partie 2, étape 3 : les trois humeurs, sans les règles de déplacement.
  fsm: `state = 'patrol'

function ghost()
  distanceX = pacman.X - me.X
  distanceY = pacman.Y - me.Y
  totalDistance = math.abs(distanceX) + math.abs(distanceY)

  state = 'patrol'
  if totalDistance <= 5 then state = 'follow' end
  if game.scaredTimer > 0 then state = 'scared' end

  return nil
end
`,

  // Bonus « Tenir sa direction » : compter les appels pour compter le temps.
  holdDirection: `math.randomseed(1)
state = 'patrol'
compteur = 0

function ghost()
  canGoLeft = not map.isWall(me.X - 1, me.Y)
  canGoRight = not map.isWall(me.X + 1, me.Y)
  canGoUp = not map.isWall(me.X, me.Y - 1)
  canGoDown = not map.isWall(me.X, me.Y + 1)

  compteur = compteur + 1
  if compteur < 90 then
    if me.direction == 'left' and canGoLeft then return 'left' end
    if me.direction == 'right' and canGoRight then return 'right' end
    if me.direction == 'up' and canGoUp then return 'up' end
    if me.direction == 'down' and canGoDown then return 'down' end
  end

  compteur = 0
  possibleDirections = {}
  if canGoLeft then table.insert(possibleDirections, 'left') end
  if canGoRight then table.insert(possibleDirections, 'right') end
  if canGoUp then table.insert(possibleDirections, 'up') end
  if canGoDown then table.insert(possibleDirections, 'down') end
  index = math.random(1, #possibleDirections)
  return possibleDirections[index]
end
`,

  // Compte les appels : sert à vérifier la cadence promise par le sujet.
  counter: `calls = 0

function ghost()
  calls = calls + 1
  return nil
end
`,
};
