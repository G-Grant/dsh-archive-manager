import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
declare class ArchiveManager extends TypertRemoteService {
    constructor(ctx: any);
    probe(): Promise<void>;
    listArchivedSessions(): Promise<{
        sessions: {
            sessionId: string;
            title: any;
            preview: any;
            createdAt: number;
            updatedAt: number;
            cwd: any;
            project: {
                name: string;
                path: string;
            };
        }[];
        debug: {
            archived: number;
            described: number;
            titled: number;
            previewed: number;
            elapsedMs: number;
            at: string;
        };
    }>;
    purgeArchivedSessions(request: any): Promise<{
        results: any[];
    }>;
    unarchiveSessions(request: any): Promise<{
        results: any[];
    }>;
}
export { ArchiveManager };
export default ArchiveManager;
//# sourceMappingURL=index.d.ts.map