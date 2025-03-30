

export class Graph {

	public nodes: Node[] = [];
	public add(node: Node | null = null): Node {
		if (node == null) {
			node = new Node();
		}
		this.nodes.push(node);
		return node;
	}

	public remove(node: Node): void {
		node.unlinkAll();
		this.nodes.splice(this.nodes.indexOf(node), 1);
	}

	public aStar(start: Node, goal: Node, exclude: Node[] | null = null): Node[] | null {
		const closedSet: Node[] = exclude != null ? [...exclude] : [];
		const openSet: Node[] = [start];
		const cameFrom: Map<Node, Node> = new Map();

		const gScore: Map<Node, number> = new Map();
		gScore.set(start, 0);

		while (openSet.length > 0) {
			const current = openSet.shift();
			if (current == goal)
				return this.buildPath(cameFrom, current);
			if (current == null)
				continue;


			closedSet.push(current);

			const curScore = gScore.get(current)!;
			for (const neighbour of current.links.keys()) {
				if (closedSet.includes(neighbour))
					continue;

				const score = curScore + current.links.get(neighbour)!;
				if (!openSet.includes(neighbour))
					openSet.push(neighbour);
				else if (score >= gScore.get(neighbour)!)
					continue;

				cameFrom.set(neighbour, current);
				gScore.set(neighbour, score);
			}
		}

		return null;
	}

	private buildPath(cameFrom: Map<Node, Node>, current: Node): Node[] {
		const path = [current];

		while (cameFrom.has(current))
			path.push(current = cameFrom.get(current)!);

		return path;
	}

	public calculatePrice(path: Array<Node>): number {
		if (path.length < 2) {
			return 0;
		}

		let price = 0.0;
		let current = path[0];
		let next = path[1];
		for (let i = 0; i < path.length; i++) {
			if (current.links.has(next)) {
				price += current.links.get(next)!;
			}
			else {
				return NaN;
			}
			current = next;
			next = path[i + 1];
		}
		return price;
	}
}

export class Node {
	public links: Map<Node, number> = new Map();



	public link(node: Node, price: number = 1, symmetrical: boolean = true) {
		this.links.set(node, price);
		if (symmetrical) {
			node.links.set(this, price);
		}
	}

	public unlink(node: Node, symmetrical = true): void {
		this.links.delete(node);
		if (symmetrical) {
			node.links.delete(this);
		}
	}

	public unlinkAll(): void {
		for (const node of this.links.keys()) {
			this.unlink(node);
		}
	}
}