import type { UserProfile } from "../../../types";

export interface Repository<TEntity, TCreateInput, TUpdates> {
    subscribe(
        userId: string,
        onSuccess: (entities: TEntity[]) => void,
        onError: (error: Error) => void,
    ): () => void;
    create(input: TCreateInput, user: UserProfile, id: string): Promise<TEntity>;
    update(id: string, updates: TUpdates): Promise<void>;
    delete(id: string): Promise<void>;
}
