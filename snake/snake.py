import curses, random, time

def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.timeout(100)
    h, w = stdscr.getmaxyx()
    snake = [(h//2, w//4-i) for i in range(3)]
    d = curses.KEY_RIGHT
    food = (h//2, w//2)
    stdscr.addch(*food, '🍎')
    score = 0

    while True:
        key = stdscr.getch()
        if key in (curses.KEY_UP, curses.KEY_DOWN, curses.KEY_LEFT, curses.KEY_RIGHT):
            if abs(key - d) != 2:
                d = key

        head = snake[0]
        moves = {curses.KEY_UP:(-1,0), curses.KEY_DOWN:(1,0), curses.KEY_LEFT:(0,-1), curses.KEY_RIGHT:(0,1)}
        dy, dx = moves[d]
        new = (head[0]+dy, head[1]+dx)

        if new[0] in (0, h-1) or new[1] in (0, w-1) or new in snake:
            stdscr.nodelay(False)
            stdscr.addstr(h//2, w//2-5, f"GAME OVER! Score: {score}")
            stdscr.getch()
            return

        snake.insert(0, new)
        if new == food:
            score += 1
            while True:
                food = (random.randint(1,h-2), random.randint(1,w-2))
                if food not in snake: break
            stdscr.addch(*food, '🍎')
        else:
            stdscr.addch(*snake.pop(), ' ')

        stdscr.addch(*snake[0], '█')
        stdscr.addstr(0, 2, f" Score: {score} ")

curses.wrapper(main)
