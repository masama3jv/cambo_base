import { query } from '../db/connection.js';

interface Team {
  id: number;
  name: string;
}

interface Court {
  id: number;
  name: string;
}

interface ScheduleMatch {
  home_team_id: number;
  away_team_id: number;
  court_id: number;
  match_date: Date;
  duration_minutes: number;
}

interface CalendarConfig {
  tournamentId: number;
  format: 'round_robin' | 'groups' | 'elimination' | 'mixed';
  teams: Team[];
  courts: Court[];
  startDate: Date;
  endDate: Date;
  matchDurationMinutes: number;
  breakMinutes: number;
  startTime: string; // 'HH:MM'
  endTime: string;   // 'HH:MM'
  datesAvailable: string[]; // Format: 'HH:MM-HH:MM'
  matchesPerDay: number;
}

// Round-robin scheduler: every team plays every other team once
function generateRoundRobin(config: CalendarConfig): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  const teams = config.teams;

  // Generate all unique matchups
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        home_team_id: teams[i].id,
        away_team_id: teams[j].id,
        court_id: config.courts[0].id,
        match_date: new Date(),
        duration_minutes: config.matchDurationMinutes
      });
    }
  }

  return scheduleMatches(matches, config);
}

// Group stage scheduler
function generateGroupStage(config: CalendarConfig): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  const groupSize = Math.ceil(config.teams.length / 2);
  
  // Split teams into groups
  const group1 = config.teams.slice(0, groupSize);
  const group2 = config.teams.slice(groupSize);

  // Generate round-robin within each group
  for (let group of [group1, group2]) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({
          home_team_id: group[i].id,
          away_team_id: group[j].id,
          court_id: config.courts[0].id,
          match_date: new Date(),
          duration_minutes: config.matchDurationMinutes
        });
      }
    }
  }

  return scheduleMatches(matches, config);
}

// Single elimination scheduler
function generateElimination(config: CalendarConfig): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  let currentRound = config.teams;

  while (currentRound.length > 1) {
    const nextRound: Team[] = [];
    
    // Pair up teams
    for (let i = 0; i < currentRound.length; i += 2) {
      if (i + 1 < currentRound.length) {
        matches.push({
          home_team_id: currentRound[i].id,
          away_team_id: currentRound[i + 1].id,
          court_id: config.courts[0].id,
          match_date: new Date(),
          duration_minutes: config.matchDurationMinutes
        });
        // Placeholder for winner (will be filled after match result)
        nextRound.push(currentRound[i]);
      } else {
        // Odd team gets bye
        nextRound.push(currentRound[i]);
      }
    }
    
    currentRound = nextRound;
  }

  return scheduleMatches(matches, config);
}

// Mixed: Group stage + elimination
function generateMixed(config: CalendarConfig): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  const groupMatches = generateGroupStage(config);
  
  // For mixed, we just create the group stage for now
  // Final stage would depend on group results
  return groupMatches;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h || 9, minutes: m || 0 };
}

function setTime(date: Date, timeStr: string): void {
  const t = parseTime(timeStr);
  date.setHours(t.hours, t.minutes, 0, 0);
}

function isPastEndTime(date: Date, endTime: string): boolean {
  const end = parseTime(endTime);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const endMinutes = end.hours * 60 + end.minutes;
  return totalMinutes >= endMinutes;
}

function nextDayAtStartTime(date: Date, startTime: string): void {
  date.setDate(date.getDate() + 1);
  setTime(date, startTime);
}

// Assign dates and courts to matches
function scheduleMatches(matches: ScheduleMatch[], config: CalendarConfig): ScheduleMatch[] {
  const scheduled: ScheduleMatch[] = [];
  const courtSchedules = new Map<number, Date[]>();
  const teamSchedules = new Map<number, Date[]>();
  
  config.courts.forEach(court => courtSchedules.set(court.id, []));
  config.teams.forEach(team => teamSchedules.set(team.id, []));

  let currentDate = new Date(config.startDate);
  setTime(currentDate, config.startTime);
  let matchIndex = 0;

  while (matchIndex < matches.length && currentDate <= config.endDate) {
    const dayStart = currentDate.toDateString();
    let matchesScheduledToday = 0;

    for (let i = matchIndex; i < matches.length && matchesScheduledToday < config.matchesPerDay; i++) {
      if (isPastEndTime(currentDate, config.endTime)) {
        nextDayAtStartTime(currentDate, config.startTime);
        break;
      }

      const match = matches[i];
      const matchEnd = new Date(currentDate);
      matchEnd.setMinutes(matchEnd.getMinutes() + config.matchDurationMinutes);

      if (isPastEndTime(matchEnd, config.endTime)) {
        nextDayAtStartTime(currentDate, config.startTime);
        break;
      }

      const homeTeamBusy = (teamSchedules.get(match.home_team_id) || []).some(
        d => d.toDateString() === dayStart
      );
      const awayTeamBusy = (teamSchedules.get(match.away_team_id) || []).some(
        d => d.toDateString() === dayStart
      );
      const courtBusy = (courtSchedules.get(match.court_id) || []).some(
        d => d.getTime() >= currentDate.getTime() && d.getTime() < matchEnd.getTime()
      );

      if (!homeTeamBusy && !awayTeamBusy && !courtBusy) {
        match.match_date = new Date(currentDate);
        scheduled.push(match);

        teamSchedules.get(match.home_team_id)?.push(new Date(currentDate));
        teamSchedules.get(match.away_team_id)?.push(new Date(currentDate));
        
        const courtDates = courtSchedules.get(match.court_id) || [];
        courtDates.push(new Date(currentDate));
        courtSchedules.set(match.court_id, courtDates);

        currentDate.setMinutes(currentDate.getMinutes() + config.matchDurationMinutes + config.breakMinutes);
        matchesScheduledToday++;
        matchIndex++;
      } else {
        // Try next time slot within the same day
        currentDate.setMinutes(currentDate.getMinutes() + config.matchDurationMinutes + config.breakMinutes);
      }
    }

    // If still on the same day after inner loop, move to next day
    if (currentDate.toDateString() === dayStart) {
      nextDayAtStartTime(currentDate, config.startTime);
    }
  }

  if (scheduled.length < matches.length) {
    throw new Error(`Not enough time slots. Can schedule ${scheduled.length}/${matches.length} matches`);
  }

  return scheduled;
}

export async function generateCalendar(config: CalendarConfig): Promise<ScheduleMatch[]> {
  let matches: ScheduleMatch[];

  switch (config.format) {
    case 'round_robin':
      matches = generateRoundRobin(config);
      break;
    case 'groups':
      matches = generateGroupStage(config);
      break;
    case 'elimination':
      matches = generateElimination(config);
      break;
    case 'mixed':
      matches = generateMixed(config);
      break;
    default:
      throw new Error('Invalid format');
  }

  return matches;
}

export async function saveMatchesToDatabase(
  tournamentId: number,
  matches: ScheduleMatch[]
): Promise<number> {
  let savedCount = 0;

  for (const match of matches) {
    try {
      await query(
        'INSERT INTO matches (tournament_id, home_team_id, away_team_id, court_id, match_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [tournamentId, match.home_team_id, match.away_team_id, match.court_id, match.match_date, 'pendent']
      );
      savedCount++;
    } catch (error) {
      console.error('Error saving match:', error);
    }
  }

  return savedCount;
}
