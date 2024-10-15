/* eslint-disable no-case-declarations */
/* eslint-disable no-control-regex */

/// Global Constants
const mycroftUrl = 'https://mycroftproject.com/installos.php/';
const chatGPTUrl = 'https://chatgpt.com/';
const googleAIStudioUrl = 'https://aistudio.google.com/app/prompts/new_chat';
const perplexityAIUrl = 'https://www.perplexity.ai/';
const poeUrl = 'https://poe.com';
const claudeUrl = 'https://claude.ai';
const youUrl = 'https://you.com';
const andiUrl = 'https://andisearch.com';
const exaUrl = 'https://exa.ai/search';
const base64MultiSearchIcon = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2aWV3Qm94PSIwIDAgNjQwIDY0MCIgd2lkdGg9IjY0MCIgaGVpZ2h0PSI2NDAiPjxkZWZzPjxwYXRoIGQ9Ik0xMDQuODQgNTMzLjU3QzI3LjYzIDQ1OC4wNiAyNy42MyAxODEuOTQgMTA0Ljg0IDEwNi40M0MxODIuMDUgMzAuOTIgNDcyLjk3IDIzLjM3IDU0MS42IDEwNi40M0M2MTAuMjIgMTg5LjQ5IDYxMC4yMiA0NTAuNTEgNTQxLjYgNTMzLjU3QzQ3Mi45NyA2MTYuNjMgMTgyLjA1IDYwOS4wOCAxMDQuODQgNTMzLjU3WiIgaWQ9ImE5WUNBTG1FOSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMzg4LjUyQzQ2OC43MyAzOTcuNiA0NjEuMzggNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0MjUuODQgNDA0Ljk1IDIxNC4xNiA0MDQuOTUgMTg3LjcgNDA0Ljk1QzE3OC42MiA0MDQuOTUgMTcxLjI3IDM5Ny42IDE3MS4yNyAzODguNTJDMTcxLjI3IDM2Ni40OSAxNzEuMjcgMTkwLjI1IDE3MS4yNyAxNjguMjJDMTcxLjI3IDE2My42NiAxNzQuOTIgMTYwIDE3OS40OCAxNjBDMTg1LjY0IDE2MCAyMzQuOTEgMTYwIDI0MS4wNyAxNjBDMjQzLjM3IDE2MCAzMTMuMTggMTU4LjI3IDMxNC43NCAxNjBDMzE2Ljg1IDE2Mi4zMyAzMzcuMjEgMTgzLjcyIDMzOS4zMiAxODYuMDVDMzQwLjg4IDE4Ny43OCAzNDAuMTcgMTg4Ljc2IDM0Mi41MSAxODguNzZDMzYxLjEyIDE4OC43NiA0NDEuOSAxODguNzYgNDYwLjUyIDE4OC43NkM0NjUuMDQgMTg4Ljc2IDQ2OC43MyAxOTIuNDIgNDY4LjczIDE5Ni45OEM0NjguNzMgMjM1LjI5IDQ2OC43MyAzNjkuMzYgNDY4LjczIDM4OC41MloiIGlkPSJiMjNGdHkzcUxsIj48L3BhdGg+PHBhdGggZD0iTTQ2OC43MyAzODguNTJDNDY4LjczIDM5Ny42IDQ2MS4zOCA0MDQuOTUgNDUyLjMgNDA0Ljk1QzQyNS44NCA0MDQuOTUgMjE0LjE2IDQwNC45NSAxODcuNyA0MDQuOTVDMTc4LjYyIDQwNC45NSAxNzEuMjcgMzk3LjYgMTcxLjI3IDM4OC41MkMxNzEuMjcgMzY2LjQ5IDE3MS4yNyAxOTAuMjUgMTcxLjI3IDE2OC4yMkMxNzEuMjcgMTYzLjY2IDE3NC45MiAxNjAgMTc5LjQ4IDE2MEMxODUuNjQgMTYwIDIzNC45MSAxNjAgMjQxLjA3IDE2MEMyNDMuMzcgMTYwIDI0NS41OSAxNjAuOTkgMjQ3LjE1IDE2Mi43MUMyNDkuMjYgMTY1LjA1IDI2Ni4xMiAxODMuNzIgMjY4LjIzIDE4Ni4wNUMyNjkuNzkgMTg3Ljc4IDI3Mi4wMSAxODguNzYgMjc0LjM1IDE4OC43NkMyOTIuOTcgMTg4Ljc2IDQ0MS45IDE4OC43NiA0NjAuNTIgMTg4Ljc2QzQ2NS4wNCAxODguNzYgNDY4LjczIDE5Mi40MiA0NjguNzMgMTk2Ljk4QzQ2OC43MyAyMzUuMjkgNDY4LjczIDM2OS4zNiA0NjguNzMgMzg4LjUyWiIgaWQ9ImIxeWlRN0RaZlgiPjwvcGF0aD48cGF0aCBkPSJNMTcxLjI3IDM4OC41MkMxNzEuMjcgMzk3LjYgMTc4LjYyIDQwNC45NSAxODcuNyA0MDQuOTVDMjE0LjE2IDQwNC45NSA0MjUuODQgNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0NjEuMzggNDA0Ljk1IDQ2OC43MyAzOTcuNiA0NjguNzMgMzg4LjUyQzQ2OC43MyAzODcuODMgNDY4LjczIDM4NC4zOSA0NjguNzMgMzc4LjJMMTcxLjI3IDM3OC4yQzE3MS4yNyAzODQuMzkgMTcxLjI3IDM4Ny44MyAxNzEuMjcgMzg4LjUyWiIgaWQ9ImJUazNsUzdZdSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMjM1LjJDNDY4LjczIDIzNS4yIDQ2OC43MyAyMzUuMiA0NjguNzMgMjM1LjJDNDY4LjczIDI0NS4zMyA0NjguNzMgMjUwLjk2IDQ2OC43MyAyNTIuMDlDNDY4LjczIDI1Mi4wOSA0NjguNzMgMjUyLjA5IDQ2OC43MyAyNTIuMDlDMjkwLjI1IDI1Mi4wOSAxOTEuMSAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjUyLjA5IDE3MS4yNyAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjQxLjk1IDE3MS4yNyAyMzYuMzIgMTcxLjI3IDIzNS4yQzE3MS4yNyAyMzUuMiAxNzEuMjcgMjM1LjIgMTcxLjI3IDIzNS4yQzM0OS43NSAyMzUuMiA0NDguOSAyMzUuMiA0NjguNzMgMjM1LjJaIiBpZD0ibHJvTTdzSGZLIj48L3BhdGg+PHBhdGggZD0iTTQ2MS4yMyA0NTEuNzRDNDY3Ljc2IDQ1OC4wNiA0NjcuOTMgNDY4LjQ2IDQ2MS42MiA0NzQuOTlDNDU1LjMxIDQ4MS41MSA0NDQuOTEgNDgxLjY5IDQzOC4zOCA0NzUuMzhDNDMzLjgzIDQ3MC45OCA0MTEuMDcgNDQ4Ljk4IDM3MC4xIDQwOS4zN0wzOTIuOTUgMzg1Ljc0QzQzMy45MiA0MjUuMzQgNDU2LjY3IDQ0Ny4zNCA0NjEuMjMgNDUxLjc0WiIgaWQ9ImExSmVLeHNoYiI+PC9wYXRoPjxwYXRoIGQ9Ik0zODguOTIgMjk0Ljg5QzQyMC4zOCAzMjUuMDcgNDIxLjQyIDM3NS4wNSAzOTEuMjMgNDA2LjUxQzM2MS4wNSA0MzcuOTggMzExLjA3IDQzOS4wMSAyNzkuNjEgNDA4LjgzQzI0OC4xNCAzNzguNjUgMjQ3LjExIDMyOC42NyAyNzcuMjkgMjk3LjIxQzMwNy40OCAyNjUuNzQgMzU3LjQ1IDI2NC43IDM4OC45MiAyOTQuODlaIiBpZD0iZUhsaUJzZTh6Ij48L3BhdGg+PHBhdGggZD0iTTM3OS43OCAzMDQuNDFDNDA1Ljk4IDMyOS41NSA0MDYuODQgMzcxLjE3IDM4MS43MSAzOTcuMzhDMzU2LjU3IDQyMy41OCAzMTQuOTUgNDI0LjQ0IDI4OC43NCAzOTkuM0MyNjIuNTQgMzc0LjE3IDI2MS42OCAzMzIuNTUgMjg2LjgyIDMwNi4zNEMzMTEuOTUgMjgwLjE0IDM1My41NyAyNzkuMjggMzc5Ljc4IDMwNC40MVoiIGlkPSJhMTdycHZGTEgyIj48L3BhdGg+PHBhdGggZD0iTTM3NC4xNyAzMjMuNjhDMzczLjggMzI2LjY0IDM2MS4yNSAzMTQuMjEgMzQwLjc4IDMxMS42N0MzMjAuMzEgMzA5LjEzIDI5OS42NyAzMTcuNDQgMzAwLjA0IDMxNC40OEMzMDAuNDEgMzExLjUzIDMxOC4zOCAyOTkuMTkgMzM4Ljg1IDMwMS43M0MzNTkuMzIgMzA0LjI3IDM3NC41MyAzMjAuNzIgMzc0LjE3IDMyMy42OFoiIGlkPSJhUk9DeWh3dkQiPjwvcGF0aD48cGF0aCBkPSJNNDQ4LjQ2IDQzOS40MUM0NDguNDYgNDM5LjQxIDQ0OC40NiA0MzkuNDEgNDQ4LjQ2IDQzOS40MUM0NTIuMDEgNDQyLjgzIDQ1My45OCA0NDQuNzQgNDU0LjM3IDQ0NS4xMkM0NTQuMzcgNDQ1LjEyIDQ1NC4zNyA0NDUuMTIgNDU0LjM3IDQ0NS4xMkM0NDAuNjYgNDU5LjMgNDMzLjA1IDQ2Ny4xOCA0MzEuNTIgNDY4Ljc1QzQzMS41MiA0NjguNzUgNDMxLjUyIDQ2OC43NSA0MzEuNTIgNDY4Ljc1QzQyNy45OCA0NjUuMzMgNDI2LjAxIDQ2My40MiA0MjUuNjEgNDYzLjA0QzQyNS42MSA0NjMuMDQgNDI1LjYxIDQ2My4wNCA0MjUuNjEgNDYzLjA0QzQzOS4zMiA0NDguODYgNDQ2Ljk0IDQ0MC45OCA0NDguNDYgNDM5LjQxWiIgaWQ9ImFNUGNnNWJZbCI+PC9wYXRoPjxwYXRoIGQ9Ik00MzMuNjkgNDI1LjEyQzQzMy42OSA0MjUuMTIgNDMzLjY5IDQyNS4xMiA0MzMuNjkgNDI1LjEyQzQzNy4yNCA0MjguNTUgNDM5LjIxIDQzMC40NiA0MzkuNiA0MzAuODRDNDM5LjYgNDMwLjg0IDQzOS42IDQzMC44NCA0MzkuNiA0MzAuODRDNDI1Ljg5IDQ0NS4wMiA0MTguMjcgNDUyLjkgNDE2Ljc1IDQ1NC40N0M0MTYuNzUgNDU0LjQ3IDQxNi43NSA0NTQuNDcgNDE2Ljc1IDQ1NC40N0M0MTMuMjEgNDUxLjA1IDQxMS4yNCA0NDkuMTQgNDEwLjg0IDQ0OC43NkM0MTAuODQgNDQ4Ljc2IDQxMC44NCA0NDguNzYgNDEwLjg0IDQ0OC43NkM0MjQuNTUgNDM0LjU4IDQzMi4xNyA0MjYuNyA0MzMuNjkgNDI1LjEyWiIgaWQ9Imk0aEZYWXhoOWkiPjwvcGF0aD48L2RlZnM+PGc+PGc+PGc+PHVzZSB4bGluazpocmVmPSIjYTlZQ0FMbUU5IiBvcGFjaXR5PSIxIiBmaWxsPSIjMzM0ZDVjIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2E5WUNBTG1FOSIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYjIzRnR5M3FMbCIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMjNGdHkzcUxsIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMXlpUTdEWmZYIiBvcGFjaXR5PSIxIiBmaWxsPSIjZmNkNDYyIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2IxeWlRN0RaZlgiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2JUazNsUzdZdSIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiVGszbFM3WXUiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2xyb003c0hmSyIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNscm9NN3NIZksiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExSmVLeHNoYiIgb3BhY2l0eT0iMSIgZmlsbD0iI2RjODc0NCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNhMUplS3hzaGIiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2VIbGlCc2U4eiIgb3BhY2l0eT0iMSIgZmlsbD0iI2U1NjM1MyIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNlSGxpQnNlOHoiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExN3JwdkZMSDIiIG9wYWNpdHk9IjEiIGZpbGw9IiNlMWU2ZTkiIGZpbGwtb3BhY2l0eT0iMSI+PC91c2U+PGc+PHVzZSB4bGluazpocmVmPSIjYTE3cnB2RkxIMiIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYVJPQ3lod3ZEIiBvcGFjaXR5PSIxIiBmaWxsPSIjZWJmMGYzIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FST0N5aHd2RCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYU1QY2c1YllsIiBvcGFjaXR5PSIxIiBmaWxsPSIjZTFlNmU5IiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FNUGNnNWJZbCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjaTRoRlhZeGg5aSIgb3BhY2l0eT0iMSIgZmlsbD0iI2UxZTZlOSIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNpNGhGWFl4aDlpIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==';

const base64BackIcon = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC+ElEQVR4nO1ZTWsUQRAd/DjoTaMXP36FGBIQFrqXECGHxOp2k3jyEjyIR6NByEWNIHgIJhr8AcKY6o1rVATx4ywqagzEg6LmoMluPEmyRhmp3Rg364ad6amZMbAPCgYGpt7rru6ufuM4DTTQQGhoV2+WRrcKhAGBCiXCW4mwIA38KEXpWU2V3hl1No1dLYODg5ucpNGWzeyXRl2SBmalUV7A+CwQhlLYtS924u2u3i0QxoSBogXxNSEMFAXCqDSdTbGQT4/rXmGgEJb4P0JQ5eW4zkRG/MBY31Zp4AY3cVkdqK6lHqe2sJLvyHVsl6juRU7erJbVJOXkG/kYycsKESwzEUvZmPXWBYyGI4/qWFLk5UqkDRy1HPnOJokwn7QAgSqfyvXsCiyA9vmkycu/cTUQeTodOQ4pxllYEq7eG6B8qD0Il/Ty8xFmEXDRF3lqsqhPsU3Uls14N2eyHoF3JmCWmkYfo69bbZMcmTzuvZx7UyLPL0B5wujmugKoJbb5+IlHp70v3+dWyUchIG30GR8zACboh4eeDXtLP4tryEchQBq45UOAmrKp91pgLyGE1/VLyGerXF3vtTC98C5QyHp5Eeb9CCja1DsHZN0ZUEssAnLvH7CT5xTgq4SuvLjuLf9a9jghOUooyCI+9fScV1j8ti6hk08GAoVkWcRl68P3zpC53+dNF2bsRtQEDjeSg6x9ose7++Fh5AIEQn9dAWQ62SaoXhfsM4BdB301cwLhk22SynXBOvoGPvp288gxC5Psz7pgnoELTpwXmsO3e5K70BDKdh9zDduXz7ATFG2u3ikMzCVOHlXe2jcVqLqTF6CVEwbkVW6o0qn98yL4JYehdO6wmbxktJJXGZsAVLkWV29zOEGjEcfOJAwMs9vrlSCvMgrLURj1NfSCDbLFkt1HB0x48rBIo35osneHEzfodCTHzKZ3ot5GIpxPT3TvcZJGqQE0upl8G7I+6OJBN7vSD7xy0C3v1cq7fuoq/4vfrA004Gx8/AaA9k9iqAR7zQAAAABJRU5ErkJggg==';

const base64ContextSearchIcon =
    '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';

const os = getOS();
const notifySearchEngineNotFound = browser.i18n.getMessage('notifySearchEngineNotFound');
const aiUrls = [chatGPTUrl, googleAIStudioUrl, perplexityAIUrl, poeUrl, claudeUrl, youUrl, andiUrl, exaUrl];
const ICON32 = '32px'; // icon width is 32px

// Global variables
let logToConsole = false; // Debug
let meta = '';
if (os === 'macOS') {
    meta = 'cmd+';
} else if (os === 'Windows') {
    meta = 'win+';
} else if (os === 'Linux') {
    meta = 'super+';
} else meta = 'meta+';
let tabUrl = '';
let domain = '';
let pn = '';
let keysPressed = {};
let textSelection = '';
let navEntered = false;
let xPos;
let yPos;

// Current state
if (logToConsole) {
    console.log(document.readyState);
}

if (document.readyState === "complete") {
    init();
}

/// Event handlers
// Run init function when readyState is complete
document.onreadystatechange = () => {
    if (logToConsole) console.log(document.readyState);
    if (document.readyState === "complete") {
        init();
    }
};

// Text selection change event listener
document.addEventListener('selectionchange', handleTextSelection);

// Mouseover event listener
document.addEventListener('mouseover', handleMouseOver);

// Right-click event listener
document.addEventListener('contextmenu', handleRightClickWithoutGrid);

// Mouse down event listener
document.addEventListener('mousedown', setTextSelection);

// Mouse up event listener
document.addEventListener('mouseup', handleAltClickWithGrid);

// Key down event listener
document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (event.target.nodeName === 'INPUT' || !isKeyAllowed(event)) return;
    keysPressed[key] = event.code;
    if (logToConsole) console.log(keysPressed);
});

// Key up event listener
document.addEventListener('keyup', handleKeyUp);

// Storage change event listener
browser.storage.onChanged.addListener(handleStorageChange);

/// Handle Incoming Messages
// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
    const action = message.action;
    if (logToConsole) console.log(message.action);
    switch (action) {
        case 'launchIconsGrid':
            return handleAltClickWithGrid(null);
        case 'getSearchEngine':
            return getOpenSearchEngine();
        default:
            console.error('Unexpected action:', action);
            return false;
    }
});

async function getOpenSearchEngine() {
    try {
        const url = document.querySelector('link[type="application/opensearchdescription+xml"]').href;
        if (logToConsole) console.log(url);
        // Fetch search engine data
        const result = await getNewSearchEngine(url);
        // Send msg to background script to get the new search engine added
        if (result !== null) await sendMessage('addNewSearchEngine', result);
    } catch (err) {
        if (logToConsole) console.log(err);
        await sendMessage('notify', notifySearchEngineNotFound);
    }
}

async function ask(url, promptText) {
    if (logToConsole) console.log(`Prompt is: ${promptText}`);
    if (logToConsole) console.log(`URL is: ${url}`);
    if (logToConsole) console.log(`Ready state is: ${document.readyState}`);

    let submissionMade = false;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const handleChatInput = async () => {
        if (submissionMade) return; // Prevent multiple submissions

        let textarea, submit;

        // Get the text area and submit button based on the AI chat engine
        if (url.includes('aistudio.google.com')) {
            if (logToConsole) console.log("AI Studio detected.");
            textarea = document.querySelector('textarea[aria-label="User text input"]');
            submit = document.querySelector("button[class*='run-button']");
        } else if (url.includes('www.perplexity.ai/')) {
            textarea = document.querySelector('textarea[placeholder="Ask anything..."]');
            submit = document.querySelector('button[aria-label="Submit"]');
        } else if (url.includes('poe.com')) {
            textarea = document.querySelector('textarea[placeholder="Start a new chat"]');
            //submit = document.querySelector("button[class*='ChatMessageSendButton']");
            submit = false;
        } else if (url.includes('chatgpt.com')) {
            textarea = document.getElementById('prompt-textarea');
            submit = textarea.parentElement.nextSibling;
        } else if (url.includes('claude.ai')) {
            textarea = document.querySelector('div[contenteditable="true"]');
        } else if (url.includes('you.com')) {
            textarea = document.getElementById('search-input-textarea');
            submit = document.querySelector('button[type="submit"]');
        } else if (url.includes('andisearch.com')) {
            textarea = document.querySelector('input[name="message"]');
            submit = document.querySelector('button[type="submit"]');
        } else if (url.includes('exa.ai/search')) {
            textarea = document.querySelector('textarea[name="Search"]');
            submit = textarea.nextSibling.querySelector('a');
        } else {
            const textareas = document.getElementsByTagName("textarea");
            textarea = textareas[textareas.length - 1];
            const buttons = document.getElementsByTagName("button");
            submit = buttons[buttons.length - 1];
        }

        if (logToConsole) console.log(`Text area:`);
        if (logToConsole) console.log(textarea);
        if (logToConsole) console.log(`Submit button:`);
        if (logToConsole) console.log(submit);

        if (textarea) {
            textarea.focus();
            if (logToConsole) console.log("Text area found.");
            if (url.includes('claude.ai')) {
                textarea.textContent = promptText;
                await new Promise(resolve => setTimeout(resolve, 1000));
                submit = document.querySelector('button[aria-label="Send Message"]');
            } else {
                textarea.value = promptText;
            }

            if (logToConsole) console.log(`Text entered: ${textarea.value}`);

            // Dispatching the necessary events to simulate user input
            textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
            //textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            //textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        }

        // Wait for a moment to allow the page to process the input
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (submit && !submit.disabled) {
            submit.click();
            submissionMade = true; // Mark the submission as done
            if (logToConsole) console.log("Submission clicked.");
        } else {
            if (logToConsole) console.log("Submit button not found or disabled.");
        }
    };

    // Run the handler directly if the page is already loaded and doesn't need waiting for mutations
    if (document.readyState === 'complete' && !submissionMade && !window.location.href.includes('#_sidebar')) {
        if (logToConsole) console.log("Page is ready, handling it directly...");
        await handleChatInput();
    } else if (document.readyState === 'complete' && !submissionMade && window.location.href.includes('#_sidebar')) {
        // Wait for the page to load and then handle the input
        new MutationObserver(() => {
            if (logToConsole) console.log("Sidebar content script loaded, handling it...");
            handleChatInput();
            //browser.runtime.sendMessage({ action: "sidebarContentUpdated", url: window.location.href });
        }).observe(document.documentElement, { childList: true, subtree: true });
    }
}

async function init() {
    tabUrl = window.location.href;
    pn = window.location.pathname;
    domain = window.location.hostname;

    // Set debugging mode
    const data = await browser.storage.sync.get();
    const options = data.options;
    if (options !== undefined && options !== null) {
        if ('logToConsole' in options) {
            logToConsole = options.logToConsole;
        }
    }

    // If debugging mode is enabled, log the tab url and domain
    if (logToConsole) {
        console.log(`Tab url: ${tabUrl}`);
        console.log(`Path name: ${pn}`);
        console.log(`Domain: ${domain}`);
    }
    if (aiUrls.includes(domain)) console.log(`AI search engine detected: ${domain}`);
    // If the web page contains selected text, then sent it to the background script
    await handleTextSelection();

    // For all input elements on the page that are descendants of a form element, except for input elements with the type "hidden" or without any type, add a double click event listener
    document.querySelectorAll('form input:not([type="hidden"])').forEach(inputTextField => {
        inputTextField.addEventListener('dblclick', handleInputDblclick);
    });


    // If the web page is opened in the sidebar, then inject a stylesheet
    if (tabUrl.endsWith('#_sidebar')) {
        const stylesheetUrl = browser.runtime.getURL('/styles/search_results.css');
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', stylesheetUrl);
        document.head.appendChild(link);
    }

    // If the web page is for an AI search, then send a message to the background script and wait for a response
    if (logToConsole && aiUrls.includes('https://' + domain)) console.log(`AI search engine detected: ${domain}`);
    const response = await sendMessage('contentScriptLoaded', { domain, tabUrl });
    if (response.action === 'askPrompt') {
        try {
            const { url, prompt } = response.data;
            await ask(url, prompt);
        } catch (err) {
            if (logToConsole) console.log(err);
            await sendMessage('notify', notifySearchEngineNotFound);
        }
    } else if (response.action === 'displaySearchResults') {
        try {
            const results = response.data;
            const html = document.getElementsByTagName('html')[0];
            const parser = new DOMParser();
            const doc = parser.parseFromString(results, 'text/html');
            if (logToConsole) console.log(results);
            if (logToConsole) console.log(doc.head);
            if (logToConsole) console.log(doc.body);
            html.removeChild(document.head);
            html.removeChild(document.body);
            html.appendChild(doc.head);
            html.appendChild(doc.body);
        } catch (err) {
            if (logToConsole) console.log(err);
            await sendMessage('notify', notifySearchEngineNotFound);
        }
    } else {
        if (logToConsole) console.error("Received undefined response or unexpected action from background script.");
        if (logToConsole) console.log(`Response: ${response}`);
    }

    // If the website doesn't contain an opensearch plugin, then hide the Page action
    const linkElement = document.querySelector('link[type="application/opensearchdescription+xml"]');
    const isLinkElement = linkElement instanceof HTMLLinkElement;
    let pageActionHidden = false;

    if (isLinkElement) {
        await sendMessage('showPageAction', null);
    } else {
        await sendMessage('hidePageAction', null);
        pageActionHidden = true;
    }

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get();
    if (logToConsole) console.log(searchEngines);

    // If there exists a search engine with a query string that includes the domain of the visited web page, then hide the Page action
    for (let id in searchEngines) {
        if (id.startsWith("separator-") || id.startsWith("chatgpt-") || searchEngines[id].isFolder) continue;
        if (searchEngines[id].url.includes(domain)) {
            if (logToConsole) console.log('This web page has already been added to your list of search engines.');
            if (!pageActionHidden) await sendMessage('hidePageAction', null);
            break;
        }
    }

    // Display clickable icons (buttons) for mycroftproject.com
    if (!hasContextSearchImage) showButtons();
}

// Check if the current web page contains a 'Context Search' icon
function hasContextSearchImage() {
    // Get all img elements on the page
    const images = document.getElementsByTagName('img');

    // Convert the HTMLCollection to an array and use some() to check
    return Array.from(images).some(img =>
        img.src.includes('context-search.svg')
    );
}

// Handle double click event on input elements for websites that use HTTP POST method
async function handleInputDblclick(e) {
    if (logToConsole) console.log(e);
    const inputElement = e.target;
    if (logToConsole) console.log(e.target.tagName);
    if (logToConsole) console.log(textSelection);
    if (inputElement.tagName !== 'INPUT' || textSelection) return;
    const form = getClosestForm(inputElement);
    const action = form?.action;
    let url;
    if (logToConsole) console.log(action);
    if (action) {
        url = action;
    } else return;
    if (logToConsole) console.log(url);

    // Fetch all input elements within the form
    const inputs = form.querySelectorAll('input');
    let formData = {};

    // Loop through each input element to gather key-value pairs
    inputs.forEach(input => {
        if (logToConsole) console.log(input);
        const name = input.name;
        let value;
        if (input === inputElement) {
            value = '%s';
        } else {
            value = input.value;
        }

        // Check if the input has a name attribute and add to formData
        if (name) {
            formData[name] = value;
        }
    });

    // Open modal dialog to input new search engine data
    await openModal(url, formData);

}

// This function opens a new window with your modal form
async function openModal(url, formData) {
    await browser.runtime.sendMessage({
        action: 'openModal',
        data: { url: url, formData: formData }
    });
}

// Traverse up the DOM tree from the given element until a form element is found, or until the root of the document is reached. If a form element is found, return the form element, otherwise return null.
function getClosestForm(element) {
    while (element) {
        if (element.tagName === 'FORM') {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

// Detect the underlying OS
function getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    // if (navigator.userAgentData.platform !== undefined) {
    // 	platform = navigator.userAgentData.platform;
    // } else {
    // 	platform = window.navigator.platform;
    // }

    if (platform.toLowerCase().startsWith("mac")) {
        return 'macOS';
    } else if (platform.toLowerCase().startsWith("ip")) {
        return 'iOS';
    } else if (platform.toLowerCase().startsWith("win")) {
        return 'Windows';
    } else if (/Android/.test(userAgent)) {
        return 'Android';
    } else if (/Linux/.test(platform)) {
        return 'Linux';
    } else return null;

}

// Handle keyboard shortcuts
async function handleKeyUp(e) {
    const modifiers = ["Control", "Shift", "Alt", "Meta"];
    if (logToConsole) console.log(e);
    if (logToConsole) console.log(keysPressed);
    // If no key has been pressed or if text is being typed in an INPUT field then discontinue
    if (!Object.keys(keysPressed).length > 0 || e.target.nodeName === 'INPUT' || !isKeyAllowed(e)) return;
    // if (e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) return;

    // If no text has been selected then discontinue
    const selectedText = getSelectedText();
    if (selectedText) {
        e.preventDefault();
        sendSelectionToBackgroundScript(selectedText);
    } else {
        return;
    }

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);

    // Store all modifier keys pressesd in var input
    let input = "";
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (logToConsole) console.log(modifier);
        if (!(modifier in keysPressed)) continue;
        switch (modifier) {
            case 'Control':
                input = input + 'ctrl+';
                break;
            case 'Shift':
                input = input + 'shift+';
                break;
            case 'Alt':
                input = input + 'alt+';
                break;
            case 'Meta':
                input = input + meta;
                break;
            default:
        }
        delete keysPressed[modifier];
    }
    if (logToConsole) console.log(`keys pressed: ${input}`);
    if (logToConsole) console.log(`remaining keys down: `);
    if (logToConsole) console.log(keysPressed);

    // For all non-modifier keys pressed...
    for (let key in keysPressed) {
        if (logToConsole) console.log(key);
        if (os === 'macOS') {
            input += keysPressed[key].substring(3).toLowerCase();
        } else {
            input += key.toLowerCase();
        }
    }
    if (logToConsole) console.log(`keys pressed: ${input}`);
    keysPressed = {};
    // If only the alt key was pressed then discontinue
    if (input === "alt+") return;
    for (let id in searchEngines) {
        if (logToConsole) console.log(id);
        const keyboardShortcut = searchEngines[id].keyboardShortcut;
        if (logToConsole) console.log(keyboardShortcut);
        if (keyboardShortcut && keyboardShortcut === input) {
            await sendMessage('doSearch', { id: id });
            break;
        }
    }
}

async function handleStorageChange(changes, area) {
    if (logToConsole) {
        console.log('The following changes have occured:\n');
        console.log(changes);
    }
    switch (area) {
        case 'sync':
            const data = await browser.storage.sync.get();
            const options = data.options;
            if (options !== undefined && options !== null) {
                if ('logToConsole' in options) {
                    logToConsole = options.logToConsole;
                }
            }
            break;
        case 'local':
            const searchEngines = await browser.storage.local.get();
            // If the website doesn't contain an opensearch plugin, then hide the Page action
            if (document.querySelector('link[type="application/opensearchdescription+xml"]') == null) {
                await sendMessage('hidePageAction', null);
            } else {
                await sendMessage('showPageAction', null);
            }
            // The following test has to be carried out when a new search engine is added...
            // If there exists a search engine with a query string that includes the domain of the visited web page, then hide the Page action
            for (let id in searchEngines) {
                if (id.startsWith("separator-") || id.startsWith("chatgpt-") || searchEngines[id].isFolder) continue;
                if (searchEngines[id].url.includes(domain)) {
                    if (logToConsole) console.log('This web page has already been added to your list of search engines.');
                    await sendMessage('hidePageAction', null);
                    break;
                }
            }
            break;
        default:
            break;
    }
}

// Use mouse down to store selected text
function setTextSelection() {
    textSelection = getSelectedText();
    if (logToConsole) console.log(`Selected text: ${textSelection}`);
}

// Triggered by mouse up event
async function handleAltClickWithGrid(e) {
    if (e !== undefined && e !== null && logToConsole) console.log('Event triggered:\n' + e.type, e.button, e.altKey, e.clientX, e.clientY);
    if (logToConsole) console.log(e);

    // If mouse up is not done with left mouse button then do nothing
    if (e !== undefined && e !== null && e.button > 0) return;

    // If the grid of icons is alreadey displayed, then close the grid and empty the text selection
    const nav = document.getElementById('context-search-icon-grid');
    if (nav !== undefined && nav !== null) {
        if (textSelection) {
            window.getSelection()?.removeAllRanges();
            textSelection = '';
        }
        closeGrid();
    }

    const data = await browser.storage.sync.get();
    const options = data.options;
    if (logToConsole) console.log(options);

    // If option is disabled then do nothing. Note: this intentionally comes after selected text is accessed as text can become unselected on click
    if (options.disableAltClick) return;

    if (logToConsole) console.log(`Selected text: ${textSelection}`);

    // IF either the Quick Icons Grid is activated on mouse up 
    // OR the option (alt) key is pressed on mouse up
    if ((e === null) || (options.quickIconGrid && e.type === 'mouseup' && textSelection.length > 0) || (e.type === 'mouseup' && e.altKey && textSelection.length > 0)) {
        // THEN display the Icons Grid
        let x, y;
        if (logToConsole) console.log('Displaying Icons Grid...');
        if (e !== null) {
            x = e.clientX;
            y = e.clientY;
        } else {
            ({ x, y } = getSelectionEndPosition());
        }
        xPos = x + parseInt(options.offsetX);
        yPos = y + parseInt(options.offsetY);
        if (logToConsole) console.log(xPos, yPos);
        if (xPos > 0 && yPos > 0) await createIconsGrid(xPos, yPos, 'root');
    }
}

function getSelectionEndPosition() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        // Get the last range in the selection.
        const range = sel.getRangeAt(sel.rangeCount - 1);
        const rect = range.getBoundingClientRect();
        return { x: rect.left + rect.width, y: rect.top + rect.height };
    }
    return { x: 0, y: 0 };
}

async function handleMouseOver(e) {
    const elementOver = e.target;
    const tag = elementOver.tagName;

    // Traverse up the DOM tree to check if a parent has the ID 'context-search-icon-grid'
    let target = elementOver;
    let level = 0;
    while (target && level < 3) {
        if (target.id === 'context-search-icon-grid') {
            return; // Exit the function if a parent has the ID
        }
        target = target.parentElement;
        level++;
    }

    // If right click is on image or a div with class 'iris-annotation-layer' then send the target url
    if (tag === 'IMG' || (tag === 'DIV' && [...elementOver.classList].includes('iris-annotation-layer'))) {
        if (logToConsole) console.log(e);
        if (elementOver.parentId === 'context-search-icon-grid') return;
        if (domain.includes('youtube.com') || domain.includes('youtu.be') || domain.includes('youtube-nocookie.com') || domain.includes('vimeo.com')) {
            // Get the video url
            const videoUrl = absoluteUrl(getClosestAnchorHref(elementOver));
            //const videoId = new URL(videoUrl).searchParams.get('v');
            //const downloadUrl = ytDownloadUrl + videoId;
            await sendMessage('setTargetUrl', videoUrl);
            if (logToConsole) console.log(`Video url: ${videoUrl}`);
        } else {
            // Get the image url
            const imgUrl = absoluteUrl(elementOver.getAttribute('src'));
            await sendMessage('setTargetUrl', imgUrl);
            if (logToConsole) console.log(`Image url: ${imgUrl}`);
        }
    }
}

async function handleRightClickWithoutGrid(e) {
    if (logToConsole) console.log(e);

    const elementClicked = e.target;
    const tag = elementClicked.tagName;

    // If right click is NOT on image or a div with class 'iris-annotation-layer' then send the target url
    if (!(tag === 'IMG' || (tag === 'DIV' && [...elementClicked.classList].includes('iris-annotation-layer')))) {
        const selectedText = getSelectedText();
        if (logToConsole) console.log(selectedText);
        // Send the selected text to background.js
        await sendMessage('setSelection', { selection: selectedText });
    } else {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }
}

function getClosestAnchorHref(imgElement) {
    if (!imgElement || imgElement.tagName !== 'IMG') {
        throw new Error('Provided element is not an img tag');
    }

    const anchorElement = imgElement.closest('a');
    return anchorElement ? anchorElement.href : null;
}

// Display clickable buttons/icons on mycroftproject.com
async function showButtons() {
    if (domain !== 'mycroftproject.com') return;
    const installLinks = document.querySelectorAll('a[href^="/install.html"]');
    const links = Array.from(installLinks);
    if (logToConsole) console.log(links);

    links.forEach(link => {
        let img = new Image();
        img.src = browser.runtime.getURL('/icons/context-search.svg');
        img.className = 'icon';
        img.height = '16px';
        img.style.marginRight = '5px';
        img.style.cursor = 'pointer';
        img.title = browser.i18n.getMessage("AddSearchEngine");

        img.onclick = async function () {
            const href = link.getAttribute('href');
            const pid = getPidAndName(href).pid;
            const name = getPidAndName(href).name;
            const url = mycroftUrl + pid + '/' + name + '.xml';
            const result = await getNewSearchEngine(url);
            // Send msg to background script to get the new search engine added
            if (result !== null) {
                await sendMessage('addNewSearchEngine', result);
            }
        }

        link.parentNode.insertBefore(img, link);
    });
}

async function handleTextSelection() {
    const selectedText = getSelectedText();
    if (logToConsole) console.log(`Selected text: ${selectedText}`);
    if (selectedText) {
        textSelection = selectedText;
        await sendSelectionToBackgroundScript(textSelection);
    }
}

function getPidAndName(string) {
    const queryString = string.substring(string.indexOf('?'));
    if (logToConsole) console.log(`query string: ${queryString}`);
    const urlParams = new URLSearchParams(queryString);
    const pid = urlParams.get('id');
    const name = urlParams.get('name');
    return { pid: pid, name: name };
}

function getSelectedText() {
    // If selection is made in Textarea or Input field
    if (
        document.activeElement != null &&
        (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')
    ) {
        const selectedTextInput = document.activeElement.value.substring(
            document.activeElement.selectionStart,
            document.activeElement.selectionEnd
        );
        if (selectedTextInput !== '') return selectedTextInput;
    }

    const controlCharactersRegex = /[\x00-\x1f\x7f-\x9f]/g;
    let plaintext = '';

    if (window.getSelection) {
        // Get the Selection object.
        const sel = window.getSelection();

        // Check if the Selection object has any ranges.
        if (sel.rangeCount > 0) {
            for (let i = 0; i < sel.rangeCount; i++) {
                const range = sel.getRangeAt(i);
                plaintext += getPlainTextContentOfRange(range);
            }
        }
    }

    // Replace control characters with a space
    plaintext = plaintext.replace(controlCharactersRegex, ' ');

    return plaintext.trim();
}

function getPlainTextContentOfRange(range) {
    const div = document.createElement('div');
    div.appendChild(range.cloneContents());
    const plainText = div.textContent.trim();
    div.remove();
    return plainText || '';
}

async function sendSelectionToBackgroundScript(selectedText) {
    const data = await browser.storage.sync.get();
    const options = data.options;
    if (logToConsole) console.log(options);

    // Set the target URL for a site search based on the current domain and selected text
    const targetUrl = options.siteSearchUrl + encodeUrl(`site:https://${domain} ${selectedText}`);
    await sendMessage('setTargetUrl', targetUrl);

    // Send the selected text to background.js
    await sendMessage('setSelection', { selection: selectedText });
}

async function createIconsGrid(x, y, folderId) {
    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get();
    let icons = [];

    // If the parent folder is not the root folder, then add an icon for backwards navigation
    if (folderId !== 'root') {
        icons.push({
            id: 'back',
            src: 'data:image/png;base64,' + base64BackIcon,
            title: 'back',
        });
    }

    // Only include the multi-search icon in the Icons Grid if required
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder) continue;
        if (folderId === 'root' && searchEngines[id].multitab) {
            icons.push({
                id: 'multisearch',
                src: 'data:image/svg+xml;base64,' + base64MultiSearchIcon,
                title: 'multi-search',
            });
            break;
        }
    }

    // Add an icon for each search engine and folder
    for (const id of searchEngines[folderId].children) {
        if (!id.startsWith("separator-") && (searchEngines[id].show || searchEngines[id].isFolder)) {
            const imageFormat = searchEngines[id].imageFormat || 'image/png';
            const title = searchEngines[id].name;
            let src = `data:${imageFormat};base64,`;
            if (isEmpty(searchEngines[id]) || isEmpty(searchEngines[id].base64)) {
                // Default icon when no favicon could be found
                src += base64ContextSearchIcon;
            } else {
                const base64String = searchEngines[id].base64;
                src += base64String;
            }
            icons.push({ id: id, src: src, title: title });
        }
    }

    // Grid dimensions
    const n = icons.length;
    const m = Math.ceil(Math.sqrt(n)); // Grid dimension: m x m matrix
    const navMaxWidth = m * 38 + 16;

    // Cleanup
    closeGrid();

    const nav = document.createElement('div');
    nav.setAttribute('id', 'context-search-icon-grid');
    nav.style.maxWidth = navMaxWidth + 'px';
    nav.style.transition = 'none';
    nav.style.backgroundColor = '#ccc';
    nav.style.border = '3px solid #999';
    nav.style.padding = '5px';
    nav.style.borderRadius = '20px';
    nav.style.zIndex = 9999;
    nav.style.position = 'fixed';
    nav.style.setProperty('top', y.toString() + 'px');
    nav.style.setProperty('left', x.toString() + 'px');
    nav.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
    nav.style.display = 'grid';
    nav.style.gap = '4px';


    for (const icon of icons) {
        if (logToConsole) console.log(icon);
        const iconElement = document.createElement("img");
        iconElement.style.width = ICON32;
        iconElement.style.height = ICON32;
        iconElement.style.display = 'inline-block !important';
        iconElement.style.border = '3px solid #ccc';
        iconElement.style.borderRadius = '10px';
        iconElement.setAttribute('id', icon.id);
        iconElement.setAttribute('src', icon.src);
        iconElement.setAttribute('title', icon.title);
        iconElement.addEventListener('mouseover', addBorder);
        iconElement.addEventListener('mouseleave', removeBorder);
        nav.appendChild(iconElement);
    }

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(nav);

    // Define event listeners for the icon grid
    nav.addEventListener('mouseup', e => onGridClick(e, folderId));
    nav.addEventListener('mouseenter', onHover);
    nav.addEventListener('mouseleave', onLeave);

    // Position icon grid contained in nav element
    nav.style.left = 0;
    nav.style.top = 0;
    let viewportWidth = document.documentElement.clientWidth;
    let viewportHeight = window.innerHeight;
    let navWidth = nav.offsetWidth + 16;
    let navHeight = nav.offsetHeight;
    if (x > viewportWidth - navWidth) {
        nav.style.left = viewportWidth - navWidth + 'px';
    } else {
        nav.style.left = x + 'px';
    }
    if (y > viewportHeight - navHeight) {
        nav.style.top = viewportHeight - navHeight + 'px';
    } else {
        nav.style.top = y + 'px';
    }
}

async function onGridClick(e, folderId) {
    e.preventDefault();
    e.stopPropagation();
    if (!navEntered) return;
    if (logToConsole) console.log('Icons Grid got clicked:' + e.type);
    const id = e.target.id;
    if (logToConsole) console.log('Search engine clicked:' + id);
    closeGrid();

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get();

    if (id === 'back') {
        const parentId = getParentFolderOf(searchEngines, folderId, 'root');
        if (logToConsole) console.log('Parent folder of ' + folderId + ' is ' + parentId);
        await createIconsGrid(xPos, yPos, parentId);
        return;
    }

    if (id === 'multisearch' || !searchEngines[id].isFolder) {
        await sendMessage('doSearch', { id: id });
    } else {
        await createIconsGrid(xPos, yPos, id);
    }
}

function getParentFolderOf(searchEngines, folderId, startFolder) {
    for (const id of searchEngines[startFolder].children) {
        if (id === folderId) {
            return startFolder;
        } else if (searchEngines[id].isFolder) {
            getParentFolderOf(searchEngines, folderId, id);
        }
    }
}

function onHover() {
    navEntered = true;
}

async function onLeave() {
    const data = await browser.storage.sync.get(null);
    const options = data.options;
    if (logToConsole) console.log(options);
    if (!options.closeGridOnMouseOut) return;
    if (logToConsole) console.log('Closing Icons Grid...');
    closeGrid();
}

function closeGrid() {
    let nav = document.getElementById('context-search-icon-grid');
    if (nav) {
        nav.parentElement.removeChild(nav);
        nav.removeEventListener('mouseup', onGridClick);
        nav.removeEventListener('mouseenter', onHover);
        nav.removeEventListener('mouseleave', onLeave);
        nav = null;
        navEntered = false;
    }
}

function addBorder(e) {
    if (logToConsole) console.log(e);
    if (logToConsole) console.log(e.target.tagName);
    if (e.target.tagName === 'IMG') {
        e.target.style.border = '3px solid #999';
    }
}

function removeBorder(e) {
    if (logToConsole) console.log(e);
    if (logToConsole) console.log(e.target.tagName);
    if (e.target.tagName === 'IMG') {
        e.target.style.border = '3px solid #ccc';
    }
}

/// Encode a url
function encodeUrl(url) {
    if (isEncoded(url)) {
        return url;
    }
    return encodeURIComponent(url);
}

/// Verify is uri is encoded
function isEncoded(uri) {
    uri = uri || '';
    return uri !== decodeURIComponent(uri);
}

async function sendMessage(action, data) {
    try {
        console.log(`Sending message: action=${action}, data=${JSON.stringify(data)}`);
        const response = await browser.runtime.sendMessage({ action: action, data: data });
        console.log(`Received response: ${JSON.stringify(response)}`);
        return response;  // Return the response received from the background script
    } catch (error) {
        console.error(`Error sending message: ${error}`);
        return null;
    }
}

function absoluteUrl(url) {
    // Create an anchor element (it automatically resolves relative URLs)
    const anchor = document.createElement('a');

    // Set the provided URL as the href of the anchor
    anchor.href = url;

    // The browser will automatically resolve it to the absolute URL
    return anchor.href;
}

async function getNewSearchEngine(url) {
    const xml = await fetchXML(url);
    const { shortName, queryString } = getNameAndQueryString(xml);

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get();

    // Prevent duplicates
    for (let id in searchEngines) {
        if (queryString === searchEngines[id].url) return null;
    }

    let id = shortName.replace(/\s/g, '-').toLowerCase();
    while (!isIdUnique(id)) {
        id = defineNewId(shortName);
    }
    id = id.trim();
    if (logToConsole) {
        console.log(id);
        console.log(shortName);
        console.log(queryString);
    }
    const numberOfSearchEngines = Object.keys(searchEngines).length;

    // Define new search engine to be added along with its default values
    searchEngines[id] = {
        index: numberOfSearchEngines,
        name: shortName,
        keyword: '',
        keyboardShortcut: '',
        multitab: false,
        url: queryString,
        show: true,
        base64: '',
    };

    if (logToConsole) console.log(searchEngines[id]);
    return { id: id, searchEngine: searchEngines[id] };
}

function fetchXML(url) {
    return new Promise((resolve, reject) => {
        let reqHeader = new Headers();
        reqHeader.append('Content-Type', 'text/xml');

        let initObject = {
            method: 'GET',
            headers: reqHeader
        };

        let userRequest = new Request(url, initObject);

        fetch(userRequest)
            .then((response) => response.text())
            .then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
            .then((xml) => {
                if (logToConsole) console.log(xml);
                resolve(xml);
            })
            .catch((err) => {
                if (logToConsole) console.log('Something went wrong!', err);
                reject(err);
            });
    });
}

// Retrieve the short name and query string from an xml document with the open search specifications
function getNameAndQueryString(xml) {
    let shortName, url;
    const x = xml.documentElement.childNodes;
    if (logToConsole) console.log(x);
    for (let node of x) {
        const key = node.nodeName;
        if (key === 'ShortName') shortName = node.textContent;
        if (key === 'Url') {
            let type = node.getAttribute('type');
            if (type === 'text/html') url = node.getAttribute('template');
        }
    }
    return { shortName: shortName, queryString: url };
}

// Define a random ID for the new search engine
function defineNewId(shortName) {
    let newId = shortName.replace(/\s/g, '-').toLowerCase();
    let randomNumber = Math.floor(Math.random() * 1000000);
    newId = newId + '-' + randomNumber.toString();
    if (logToConsole) console.log(newId);
    return newId;
}

// Ensure the ID generated is unique
async function isIdUnique(testId) {
    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);
    for (let id in searchEngines) {
        if (id === testId) {
            return false;
        }
    }
    return true;
}

// Test if an object is empty
function isEmpty(value) {
    if (typeof value === 'number') return false;
    else if (typeof value === 'string') return value.trim().length === 0;
    else if (Array.isArray(value)) return value.length === 0;
    else if (typeof value === 'object') {
        return value === null || Object.keys(value).length === 0;
    } else if (typeof value === 'boolean') return false;
    else return !value;
}

function isKeyAllowed(event) {
    const disallowedKeys = [
        'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape', ' ', 'Delete', 'Backspace', 'Home', 'End',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    ];

    return !disallowedKeys.includes(event.key);
}