import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createContext } from "react";

interface Props extends React.PropsWithChildren {
	db: DrizzleSqliteDODatabase;
}

export const DBContext = createContext<DrizzleSqliteDODatabase | null>(null);

export const DBProvider = ({ children, db }: Props) => {
	return (
		<DBContext.Provider value={db}>
			{children}
		</DBContext.Provider>
	);
};
