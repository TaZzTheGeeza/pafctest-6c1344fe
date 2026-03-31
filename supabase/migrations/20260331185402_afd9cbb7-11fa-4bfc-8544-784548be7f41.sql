CREATE TRIGGER trg_sync_player_stats
AFTER INSERT OR UPDATE OR DELETE ON public.match_player_stats
FOR EACH ROW EXECUTE FUNCTION public.sync_player_stats();