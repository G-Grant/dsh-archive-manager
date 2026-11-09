window.__ModuleLoader__.load({
  id: 'dsh-archive-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    function schema(parse) {
      return { parse };
    }

    function requestSchema() {
      return schema((value) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          throw new TypeError('request must be an object');
        }
        const keys = Object.keys(value);
        if (keys.length !== 1 || keys[0] !== 'sessionIds') {
          throw new TypeError('request must contain only sessionIds');
        }
        if (!Array.isArray(value.sessionIds) || value.sessionIds.length < 1 || value.sessionIds.length > 500) {
          throw new TypeError('sessionIds must contain between 1 and 500 items');
        }
        if (value.sessionIds.some((sessionId) => typeof sessionId !== 'string' || sessionId.length === 0)) {
          throw new TypeError('sessionIds must contain non-empty strings');
        }
        return { sessionIds: [...value.sessionIds] };
      });
    }

    function resultSchema() {
      return schema((value) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.results)) {
          throw new TypeError('result must contain a results array');
        }
        for (const item of value.results) {
          if (item === null || typeof item !== 'object' || Array.isArray(item) || typeof item.sessionId !== 'string') {
            throw new TypeError('result items must contain a sessionId');
          }
          if (item.status !== 'deleted' && item.status !== 'failed') {
            throw new TypeError('result items have an invalid status');
          }
          if (item.reason !== undefined && typeof item.reason !== 'string') {
            throw new TypeError('result reasons must be strings');
          }
          if (item.warning !== undefined && typeof item.warning !== 'string') {
            throw new TypeError('result warnings must be strings');
          }
          if (item.note !== undefined && typeof item.note !== 'string') {
            throw new TypeError('result notes must be strings');
          }
        }
        return value;
      });
    }

    function unarchiveResultSchema() {
      return schema((value) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.results)) {
          throw new TypeError('result must contain a results array');
        }
        for (const item of value.results) {
          if (item === null || typeof item !== 'object' || Array.isArray(item) || typeof item.sessionId !== 'string') {
            throw new TypeError('result items must contain a sessionId');
          }
          if (item.status !== 'unarchived' && item.status !== 'failed') {
            throw new TypeError('result items have an invalid status');
          }
          if (item.reason !== undefined && typeof item.reason !== 'string') {
            throw new TypeError('result reasons must be strings');
          }
        }
        return value;
      });
    }

    function listResultSchema() {
      return schema((value) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.sessions)) {
          throw new TypeError('result must contain a sessions array');
        }
        for (const item of value.sessions) {
          if (item === null || typeof item !== 'object' || Array.isArray(item) || typeof item.sessionId !== 'string') {
            throw new TypeError('result items must contain a sessionId');
          }
        }
        return value;
      });
    }

    const TYPERT_REMOTE = {
      package: 'dsh-archive-manager',
      descriptors: [
        {
          id: 'dsh-archive-manager#archiveManager/listArchivedSessions',
          service: 'archiveManager',
          namespace: 'archiveManager',
          method: 'listArchivedSessions',
          invocation: { kind: 'direct' },
          parameters: [],
          result: {
            mode: 'strict',
            typeSymbol: 'dsh-archive-manager/types#ListArchivedSessionsValue',
            create: listResultSchema,
          },
        },
        {
          id: 'dsh-archive-manager#archiveManager/purgeArchivedSessions',
          service: 'archiveManager',
          namespace: 'archiveManager',
          method: 'purgeArchivedSessions',
          invocation: { kind: 'direct' },
          parameters: [{
            name: 'request',
            wire: 'request',
            source: 'json',
            codec: {
              mode: 'strict',
              typeSymbol: 'dsh-archive-manager/types#PurgeArchivedSessionsRequest',
              create: requestSchema,
              jsonSchema: {
                type: 'object',
                properties: { sessionIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500 } },
                required: ['sessionIds'],
                additionalProperties: false,
              },
            },
            strictCodec: {
              mode: 'strict',
              typeSymbol: 'dsh-archive-manager/types#PurgeArchivedSessionsRequest',
              create: requestSchema,
              jsonSchema: {
                type: 'object',
                properties: { sessionIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500 } },
                required: ['sessionIds'],
                additionalProperties: false,
              },
            },
          }],
          result: {
            mode: 'strict',
            typeSymbol: 'dsh-archive-manager/types#PurgeArchivedSessionsValue',
            create: resultSchema,
            jsonSchema: {
              type: 'object',
              properties: { results: { type: 'array', items: { type: 'object' } } },
              required: ['results'],
              additionalProperties: false,
            },
          },
        },
        {
          id: 'dsh-archive-manager#archiveManager/unarchiveSessions',
          service: 'archiveManager',
          namespace: 'archiveManager',
          method: 'unarchiveSessions',
          invocation: { kind: 'direct' },
          parameters: [{
            name: 'request',
            wire: 'request',
            source: 'json',
            codec: {
              mode: 'strict',
              typeSymbol: 'dsh-archive-manager/types#UnarchiveSessionsRequest',
              create: requestSchema,
              jsonSchema: {
                type: 'object',
                properties: { sessionIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500 } },
                required: ['sessionIds'],
                additionalProperties: false,
              },
            },
            strictCodec: {
              mode: 'strict',
              typeSymbol: 'dsh-archive-manager/types#UnarchiveSessionsRequest',
              create: requestSchema,
              jsonSchema: {
                type: 'object',
                properties: { sessionIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500 } },
                required: ['sessionIds'],
                additionalProperties: false,
              },
            },
          }],
          result: {
            mode: 'strict',
            typeSymbol: 'dsh-archive-manager/types#UnarchiveSessionsValue',
            create: unarchiveResultSchema,
            jsonSchema: {
              type: 'object',
              properties: { results: { type: 'array', items: { type: 'object' } } },
              required: ['results'],
              additionalProperties: false,
            },
          },
        },
      ],
    };
    const NS = 'archive-manager';
    const PANEL_ID = 'archive-manager';
    const PLUGIN = 'dsh-archive-manager';

    const zh = {
      'panel.label': '归档会话',
      'panel.title': '归档会话',
      'panel.description': '批量永久删除已归档的会话。删除前会检查活动状态和存储路径。',
      'panel.refresh': '刷新',
      'panel.selectAll': '全选',
      'panel.clear': '清除选择',
      'panel.delete': '永久删除所选',
      'panel.empty': '没有已归档的会话。',
      'panel.emptyWithCount': 'Host 报告 {count} 条归档会话，但都没有可显示的名称。',
      'panel.loading': '正在读取归档会话…',
      'panel.connecting': '正在连接清理服务…',
      'panel.unavailable': '清理服务在当前部署不可用。',
      'panel.confirm': '将永久删除 {count} 个归档会话及其日志。此操作无法撤销。继续吗？',
      'panel.deleted': '已删除 {count} 个会话。',
      'panel.failed': '{count} 个会话未删除。',
      'panel.reason.not-archived': '会话已不在归档集合中',
      'panel.reason.open-session': '会话仍处于打开状态',
      'panel.reason.running-session': '会话仍在运行',
      'panel.reason.session-not-found': '找不到持久化日志',
      'panel.reason.storage-kind-unsupported': '存储类型不支持安全删除',
      'panel.reason.unsafe-artifact-path': '日志路径未通过安全校验',
      'panel.reason.delete-failed': '删除日志失败',
      'panel.reason.archive-state-not-cleaned': '归档状态未清理',
      'panel.reason.workspace-accounting-not-cleaned': '工作区分账未清理',
      'panel.reason.projection-cache-not-cleaned': '投影缓存未清理',
      'panel.reason.lifecycle-notified-with-warning': '生命周期通知有告警',
      'panel.close': '关闭',
      'panel.requestFailed': '请求失败：',
      'panel.unarchive': '取消归档',
      'panel.unarchiveFailed': '取消归档失败',
      'panel.dialogDone': '删除完成',
      'panel.dialogPartial': '部分会话未删除',
      'panel.dialogDeleted': '已彻底删除 {count} 个会话。',
      'panel.dialogUnarchived': '已取消归档，会话回到工作区列表。',
      'panel.reason.unarchive-failed': '取消归档时出错',
      'panel.reason.workspace-unavailable': '工作区服务不可用',
      'panel.created': '创建',
      'panel.updated': '最近',
      'panel.noPreview': '（没有可预览的消息内容）',
      'panel.previewLoading': '正在读取会话内容…',
      'panels.hide': '收起功能入口',
      'panels.show': '展开功能入口',
    };
    const en = {
      'panel.label': 'Archived sessions',
      'panel.title': 'Archived sessions',
      'panel.description': 'Permanently delete archived sessions in batches. Activity and storage paths are checked first.',
      'panel.refresh': 'Refresh',
      'panel.selectAll': 'Select all',
      'panel.clear': 'Clear selection',
      'panel.delete': 'Permanently delete selected',
      'panel.empty': 'There are no archived sessions.',
      'panel.emptyWithCount': 'The host reported {count} archived session(s), but none had a displayable name.',
      'panel.loading': 'Reading archived sessions…',
      'panel.connecting': 'Connecting to the cleanup service…',
      'panel.unavailable': 'The cleanup service is unavailable in this deployment.',
      'panel.confirm': 'Permanently delete {count} archived session(s) and their logs? This cannot be undone.',
      'panel.deleted': 'Deleted {count} session(s).',
      'panel.failed': '{count} session(s) were not deleted.',
      'panel.reason.not-archived': 'Session is no longer archived',
      'panel.reason.open-session': 'Session is still open',
      'panel.reason.running-session': 'Session is still running',
      'panel.reason.session-not-found': 'Persistent log was not found',
      'panel.reason.storage-kind-unsupported': 'Storage kind does not support safe deletion',
      'panel.reason.unsafe-artifact-path': 'Log path failed safety checks',
      'panel.reason.delete-failed': 'Log deletion failed',
      'panel.reason.archive-state-not-cleaned': 'Archive state was not cleaned',
      'panel.reason.workspace-accounting-not-cleaned': 'Workspace accounting was not cleaned',
      'panel.reason.projection-cache-not-cleaned': 'Projection cache was not cleaned',
      'panel.reason.lifecycle-notified-with-warning': 'Lifecycle notification reported a warning',
      'panel.close': 'Close',
      'panel.requestFailed': 'Request failed: ',
      'panel.unarchive': 'Unarchive',
      'panel.unarchiveFailed': 'Could not unarchive',
      'panel.dialogDone': 'Deleted',
      'panel.dialogPartial': 'Some sessions were not deleted',
      'panel.dialogDeleted': 'Permanently deleted {count} session(s).',
      'panel.dialogUnarchived': 'Unarchived; the session is back in the workspace list.',
      'panel.reason.unarchive-failed': 'Unarchiving failed',
      'panel.reason.workspace-unavailable': 'Workspace service is unavailable',
      'panel.created': 'Created',
      'panel.updated': 'Last',
      'panel.noPreview': '(no message content to preview)',
      'panel.previewLoading': 'Reading session content…',
      'panels.hide': 'Collapse feature panel bar',
      'panels.show': 'Expand feature panel bar',
    };

    const replaceCount = (value, count) => value.replace('{count}', String(count));

    function PanelIcon({ size = 20 }) {
      return h('span', {
        'data-dsh-plugin': PLUGIN,
        style: { display: 'inline-flex', width: size, height: size },
        'aria-hidden': true,
      }, h('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'none' }, [
        h('path', { key: 'box', d: 'M4 7.5h16v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-11Z', fill: 'currentColor', opacity: .85 }),
        h('path', { key: 'lid', d: 'M3 5.5A1.5 1.5 0 0 1 4.5 4h5l1.3 1.5h8.7A1.5 1.5 0 0 1 21 7H3V5.5Z', fill: 'currentColor' }),
        h('path', { key: 'arrow', d: 'M15.5 11v5m0 0-2-2m2 2 2-2', stroke: 'var(--dsw-alias-label-on-color,#fff)', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      ]));
    }

    function remoteFailure(error, operation) {
      const code = typeof error?.code === 'string' && error.code.length > 0 ? error.code : 'remote-error';
      const detail = typeof error?.message === 'string' && error.message.length > 0 ? error.message : 'unknown error';
      const failure = new Error(`${operation} failed: ${code}: ${detail}`);
      failure.code = code;
      return failure;
    }

    /** Render an epoch-millisecond stamp as a compact local `YYYY-MM-DD HH:mm`. */
    function formatStamp(value) {
      const epoch = typeof value === 'number' && Number.isFinite(value) ? value : null;
      if (epoch === null || epoch <= 0) return '';
      const date = new Date(epoch);
      const pad = (part) => String(part).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function ArchivePanel() {
      const t = ctx.locale.bind(NS);
      const reasonText = (reason) => {
        if (typeof reason !== 'string' || reason.length === 0) return t('panel.requestFailed');
        const translated = t(`panel.reason.${reason}`);
        if (typeof translated !== 'string' || translated.length === 0 || translated === `panel.reason.${reason}`) return reason;
        return translated;
      };
      const [rows, setRows] = React.useState([]);
      const [selected, setSelected] = React.useState(() => new Set());
      const [phase, setPhase] = React.useState('loading');
      const [dialog, setDialog] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [busy, setBusy] = React.useState(false);

      const load = React.useCallback(async () => {
        setPhase('loading');
        setError(null);
        try {
          await remoteReady;
          const response = await remoteNamespace().listArchivedSessions();
          if (response === null || typeof response !== 'object') {
            throw new Error('listArchivedSessions returned no response');
          }
          if (response.ok !== true) throw remoteFailure(response.error, 'listArchivedSessions');
          const sessions = Array.isArray(response.value?.sessions) ? response.value.sessions : [];
          const nextRows = sessions.map((session) => {
            const id = String(session.sessionId);
            const project = session.project && typeof session.project === 'object'
              ? { name: typeof session.project.name === 'string' ? session.project.name : '', path: typeof session.project.path === 'string' ? session.project.path : '' }
              : null;
            return {
              id,
              title: typeof session.title === 'string' && session.title.length > 0 ? session.title : id,
              preview: typeof session.preview === 'string' ? session.preview : '',
              createdText: formatStamp(session.createdAt),
              updatedText: formatStamp(session.updatedAt),
              project,
            };
          });
          setRows(nextRows);
          setSelected(new Set());
          setPhase('ready');
        } catch (loadError) {
          setPhase('error');
          setError(loadError?.message ?? String(loadError));
        }
      }, []);

      React.useEffect(() => {
        void load();
      }, [load]);

      const toggle = (id) => setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
      const deleteSelected = async () => {
        if (selected.size === 0 || busy) return;
        const message = t('panel.confirm').replace('{count}', String(selected.size));
        if (typeof window.confirm === 'function' && !window.confirm(message)) return;
        setBusy(true);
        setError(null);
        try {
          await remoteReady;
          const response = await remoteNamespace().purgeArchivedSessions({ sessionIds: [...selected] });
          if (response === null || typeof response !== 'object') {
            throw new Error('purgeArchivedSessions returned no response');
          }
          if (response.ok !== true) throw remoteFailure(response.error, 'purgeArchivedSessions');
          const results = Array.isArray(response.value?.results) ? response.value.results : [];
          const removed = new Set(results.filter((item) => item.status === 'deleted').map((item) => String(item.sessionId)));
          if (removed.size > 0) {
            setRows((current) => current.filter((row) => !removed.has(row.id)));
            setSelected((current) => {
              const next = new Set(current);
              for (const id of removed) next.delete(id);
              return next;
            });
          }
          setDialog(summarisePurge(results));
        } catch (deleteError) {
          setError(deleteError?.message ?? String(deleteError));
        } finally {
          setBusy(false);
        }
      };
      const summarisePurge = (results) => {
        const removed = results.filter((item) => item.status === 'deleted');
        const failures = results.filter((item) => item.status === 'failed');
        const lines = [replaceCount(t('panel.dialogDeleted'), removed.length)];
        for (const item of failures) lines.push(`${item.sessionId}: ${reasonText(item.reason)}`);
        return { title: failures.length > 0 ? t('panel.dialogPartial') : t('panel.dialogDone'), lines, tone: failures.length > 0 ? 'warn' : 'ok' };
      };
      const unarchiveOne = async (sessionId) => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
          await remoteReady;
          const response = await remoteNamespace().unarchiveSessions({ sessionIds: [sessionId] });
          if (response === null || typeof response !== 'object') {
            throw new Error('unarchiveSessions returned no response');
          }
          if (response.ok !== true) throw remoteFailure(response.error, 'unarchiveSessions');
          const results = Array.isArray(response.value?.results) ? response.value.results : [];
          const item = results.find((entry) => String(entry.sessionId) === sessionId);
          if (item === undefined || item.status !== 'unarchived') {
            setDialog({ title: t('panel.unarchiveFailed'), lines: [`${sessionId}: ${reasonText(item?.reason)}`], tone: 'warn' });
            return;
          }
          setRows((current) => current.filter((row) => row.id !== sessionId));
          setSelected((current) => {
            const next = new Set(current);
            next.delete(sessionId);
            return next;
          });
          setDialog({ title: t('panel.unarchive'), lines: [t('panel.dialogUnarchived')], tone: 'ok' });
        } catch (unarchiveError) {
          setDialog({ title: t('panel.unarchiveFailed'), lines: [String(unarchiveError?.message ?? unarchiveError)], tone: 'warn' });
        } finally {
          setBusy(false);
        }
      };

      return h('section', {
        'aria-label': t('panel.title'),
        'data-dsh-plugin': `${PLUGIN}-panel`,
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          height: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: 24,
          color: 'var(--dsw-alias-label-primary)',
          background: 'var(--dsw-alias-bg-l1,transparent)',
        },
      }, [
        h('div', { key: 'head', style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 } }, [
          h('div', { key: 'copy' }, [
            h('h1', { key: 'title', style: { margin: 0, fontSize: 20, lineHeight: 1.3 } }, t('panel.title')),
            h('p', { key: 'description', style: { margin: '8px 0 0', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 } }, t('panel.description')),
          ]),
          h('button', { key: 'close', type: 'button', onClick: () => ctx.get('layout')?.selectPanel(null), style: buttonStyle }, t('panel.close')),
        ]),
        h('div', { key: 'toolbar', style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }, [
          h('button', { key: 'select', type: 'button', onClick: () => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id))), disabled: rows.length === 0 || busy, style: buttonStyle }, allSelected ? t('panel.clear') : t('panel.selectAll')),
          h('button', { key: 'refresh', type: 'button', onClick: () => void load(), disabled: busy, style: buttonStyle }, t('panel.refresh')),
          h('button', { key: 'delete', type: 'button', onClick: () => void deleteSelected(), disabled: selected.size === 0 || busy || phase !== 'ready', style: { ...buttonStyle, color: 'var(--dsw-alias-label-danger,#c53939)' } }, busy ? t('panel.loading') : t('panel.delete')),
          h('span', { key: 'count', style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 13 } }, `${selected.size}/${rows.length}`),
        ]),
        phase === 'loading' && h('p', { key: 'loading', style: mutedStyle }, t('panel.loading')),
        phase === 'error' && h('p', { key: 'phase-error', role: 'alert', style: errorStyle }, `${t('panel.requestFailed')} ${error ?? ''}`),
        phase === 'ready' && rows.length === 0 && h('p', { key: 'empty', style: mutedStyle }, t('panel.empty')),
        phase === 'ready' && rows.length > 0 && h('div', { key: 'list', role: 'list', style: { display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 } }, rows.map((row) => {
          const metaParts = [];
          if (row.createdText.length > 0) metaParts.push(`${t('panel.created')} ${row.createdText}`);
          if (row.updatedText.length > 0) metaParts.push(`${t('panel.updated')} ${row.updatedText}`);
          return h('div', {
            key: row.id,
            'data-session-id': row.id,
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--dsw-alias-fill-tertiary,rgba(0,0,0,.04))',
              cursor: 'default',
            },
          }, [
            h('input', { key: 'check', type: 'checkbox', checked: selected.has(row.id), onChange: () => toggle(row.id), style: { marginTop: 3, flex: 'none' } }),
            h('span', { key: 'text', onClick: () => toggle(row.id), style: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1, cursor: 'pointer' } }, [
              h('span', { key: 'headline', style: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } }, [
                h('span', { key: 'title', style: { flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.title),
                row.project !== null && row.project.name.length > 0
                  ? h('span', {
                    key: 'project',
                    title: row.project.path,
                    style: {
                      flex: 'none',
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                      lineHeight: '18px',
                      padding: '0 7px',
                      borderRadius: 999,
                      color: 'var(--dsw-alias-label-secondary)',
                      background: 'var(--dsw-alias-fill-secondary,rgba(0,0,0,.06))',
                      border: '1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))',
                    },
                  }, row.project.name)
                  : null,
              ]),
              h('span', {
                key: 'preview',
                style: {
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: row.preview.length > 0 ? 'var(--dsw-alias-label-secondary)' : 'var(--dsw-alias-label-tertiary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'anywhere',
                },
              }, row.preview.length > 0 ? row.preview : t('panel.noPreview')),
              h('span', { key: 'meta', style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, [
                h('span', { key: 'times' }, metaParts.join(' · ')),
                row.project !== null && row.project.path.length > 0
                  ? h('span', { key: 'path', title: row.project.path, style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, `· ${row.project.path}`)
                  : null,
              ]),
            ]),
            h('button', {
              key: 'unarchive',
              type: 'button',
              'data-action': 'unarchive',
              disabled: busy,
              onClick: () => void unarchiveOne(row.id),
              style: { ...linkButtonStyle, marginTop: 1, flex: 'none', opacity: busy ? 0.6 : 1 },
            }, t('panel.unarchive')),
          ]);
        })),
        error && phase === 'ready' && h('p', { key: 'error', role: 'alert', style: errorStyle }, error),
        dialog && h('div', { key: 'dialog', style: dialogBackdropStyle }, [
          h('div', { key: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-label': dialog.title, style: dialogCardStyle }, [
            h('h2', { key: 'title', style: dialogTitleStyle }, dialog.title),
            h('div', { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 6 } }, dialog.lines.map((line, index) => h('p', {
              key: `${index}-${line.slice(0, 12)}`,
              style: { margin: 0, lineHeight: 1.55, fontSize: 13, wordBreak: 'break-word', color: dialog.tone === 'warn' ? 'var(--dsw-alias-label-danger,#c53939)' : 'var(--dsw-alias-label-secondary)' },
            }, line))),
            h('div', { key: 'actions', style: { display: 'flex', justifyContent: 'flex-end', marginTop: 4 } }, [
              h('button', { key: 'ok', type: 'button', onClick: () => setDialog(null), style: buttonStyle }, t('panel.close')),
            ]),
          ]),
        ]),
      ]);
    }

    const buttonStyle = {
      border: '1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))',
      borderRadius: 7,
      background: 'var(--dsw-alias-fill-secondary,transparent)',
      color: 'var(--dsw-alias-label-primary)',
      padding: '6px 10px',
      cursor: 'pointer',
    };
    const mutedStyle = { color: 'var(--dsw-alias-label-secondary)', margin: 0 };
    const errorStyle = { color: 'var(--dsw-alias-label-danger,#c53939)', margin: 0, lineHeight: 1.5 };
    const successStyle = { color: 'var(--dsw-alias-label-success,#18794e)', margin: 0 };
    const linkButtonStyle = {
      border: '1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))',
      borderRadius: 6,
      background: 'transparent',
      color: 'var(--dsw-alias-label-secondary)',
      padding: '2px 8px',
      fontSize: 12,
      lineHeight: '20px',
      cursor: 'pointer',
    };
    const dialogBackdropStyle = {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'rgba(0,0,0,.32)',
    };
    const dialogCardStyle = {
      width: 'min(520px,100%)',
      maxHeight: '70vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '20px 22px',
      borderRadius: 12,
      background: 'var(--dsw-alias-bg-l1,#fff)',
      border: '1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))',
      boxShadow: '0 18px 48px rgba(0,0,0,.28)',
    };
    const dialogTitleStyle = { margin: 0, fontSize: 16, lineHeight: 1.4, color: 'var(--dsw-alias-label-primary)' };
    let ctx;
    let remoteReady;

    /**
     * Resolve the mounted Remote namespace.
     *
     * The gateway installs one Cordis service per namespace under the dotted key
     * `remote.<namespace>`. Reading `ctx.remote.<namespace>` goes through the
     * traced proxy, which re-resolves the property on the *caller* fiber and
     * rejects it long after apply ("cannot get property … without inject"), so
     * the namespace is looked up by its exact service key at every call.
     */
    function remoteNamespace() {
      const service = ctx?.get?.('remote.archiveManager');
      if (service === undefined || service === null) {
        throw new Error('清理服务尚未就绪（remote.archiveManager 未注册）');
      }
      return service;
    }

    function apply(clientCtx) {
      ctx = clientCtx;
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'archive-manager: dictionaries');
      const mount = ctx.remote.$mount(TYPERT_REMOTE);
      mount.catch(() => {});
      // Never let a stalled mount leave the panel spinning forever.
      remoteReady = Promise.race([
        mount,
        new Promise((_, reject) => {
          const timer = window.setTimeout(() => reject(new Error('cleanup service mount timed out after 8s')), 8000);
          if (typeof timer?.unref === 'function') timer.unref();
        }),
      ]);
      ctx.effect(() => () => {
        mount.then((dispose) => dispose?.()).catch(() => {});
      }, 'archive-manager: remote mount');
      // TEMPORARY diagnostics: one smoke call per apply, so the host log records this page's bundle.
      void (async () => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await remoteReady;
            const response = await remoteNamespace().listArchivedSessions();
            if (response?.ok === true) return;
          } catch {
            // Diagnostics are best effort only.
          }
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        }
      })();
      const t = ctx.locale.bind(NS);
      return ctx.slots.inject('main', () => ctx.slots.inject('sidebar.panellist', () => {
        const stopMain = ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          inject: () => ({}),
        }, ArchivePanel);
        let stopIcon;
        try {
          stopIcon = ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 36,
            label: () => t('panel.label'),
            locale: NS,
          }, PanelIcon);
        } catch (error) {
          stopMain();
          throw error;
        }
        return () => {
          stopIcon?.();
          stopMain();
        };
      }));
    }

    return {
      inject: ['slots', 'locale', 'remote'],
      apply,
    };
  },
});
