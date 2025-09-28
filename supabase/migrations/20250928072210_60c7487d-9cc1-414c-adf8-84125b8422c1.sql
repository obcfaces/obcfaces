-- Create trigger to automatically update participant rating statistics
CREATE OR REPLACE TRIGGER update_participant_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contestant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_rating_comprehensive();