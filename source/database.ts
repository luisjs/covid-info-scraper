import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { resolve } from "path";
import { CovidNumbers } from "./types/covid";

const instances: { [key: string]: DatabaseInstance } = {};

export type DatabaseRecord = {
	id: string,
	info: CovidNumbers,
	timestampAdd: number
	timestampUpdate: number
};

export type DatabaseStruct = {
	records: DatabaseRecord[],
	count: number
};

export class DatabaseInstance {
	connection: lowdb.LowdbSync<DatabaseStruct>;

	constructor(connection: lowdb.LowdbSync<DatabaseStruct>) {
		this.connection = connection;

		// write file if it doesn't exist.
		// https://github.com/typicode/lowdb#usage
		this.connection
			.defaults({ records: [], count: 0 })
			.write();
	}

	find(id: string): DatabaseRecord {
		return this.connection.get("records").find({ id }).value();
	}

	add(id: string, info: CovidNumbers): void {
		this.connection.get("records").push({ id, info, timestampAdd: Date.now(), timestampUpdate: 0 }).write();
		this.connection.update("count", () => this.connection.get("records").value().length).write();
	}

	update(id: string, info: CovidNumbers): void {
		this.connection.get("records").find({ id }).assign({ info, timestampUpdate: Date.now() }).write();
	}
}

export function getDatabase(file: string, root: string = "data/"): DatabaseInstance {
	if (instances[file] == null) {
		const path = resolve(root, file + ".json");
		const adapter = new FileSync<DatabaseStruct>(path);
		const database = new DatabaseInstance(lowdb(adapter));
		instances[file] = database;
	}
	return instances[file];
}