import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface IncidentFutsal {
  type: 'goal' | 'yellow_card' | 'red_card' | 'timeout';
  minute: number;
  playerName: string;
  teamId: number;
  timestamp: Date;
}

export interface IncidentBasket {
  type: '1pt' | '2pt' | 'foul' | 'timeout';
  minute: number;
  playerName: string;
  teamId: number;
  points: number;
  timestamp: Date;
}

export interface IncidentPadel {
  type: 'set_score' | 'timeout' | 'injury';
  minute: number;
  playerName: string;
  teamId: number;
  setScore?: { team1: number; team2: number };
  timestamp: Date;
}

export interface MatchSheet {
  id: number;
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  sport: 'futsal' | 'basket' | 'padel';
  homeScore: number;
  awayScore: number;
  status: 'actiu' | 'tancat';
  incidents: (IncidentFutsal | IncidentBasket | IncidentPadel)[];
  startTime: Date;
  endTime?: Date;
}

export function createMatchSheet(
  matchId: number,
  homeTeamId: number,
  awayTeamId: number,
  sport: string
): MatchSheet {
  return {
    id: Math.random(),
    matchId,
    homeTeamId,
    awayTeamId,
    sport: sport as any,
    homeScore: 0,
    awayScore: 0,
    status: 'actiu',
    incidents: [],
    startTime: new Date()
  };
}

export function recordGoalFutsal(
  sheet: MatchSheet,
  playerName: string,
  teamId: number,
  minute: number
): MatchSheet {
  const incident: IncidentFutsal = {
    type: 'goal',
    minute,
    playerName,
    teamId,
    timestamp: new Date()
  };

  sheet.incidents.push(incident);

  if (teamId === sheet.homeTeamId) {
    sheet.homeScore++;
  } else {
    sheet.awayScore++;
  }

  return sheet;
}

export function recordCardFutsal(
  sheet: MatchSheet,
  playerName: string,
  teamId: number,
  cardType: 'yellow_card' | 'red_card',
  minute: number
): MatchSheet {
  const incident: IncidentFutsal = {
    type: cardType,
    minute,
    playerName,
    teamId,
    timestamp: new Date()
  };

  sheet.incidents.push(incident);
  return sheet;
}

export function recordBasketScore(
  sheet: MatchSheet,
  playerName: string,
  teamId: number,
  points: 1 | 2,
  minute: number
): MatchSheet {
  const incident: IncidentBasket = {
    type: points === 1 ? '1pt' : '2pt',
    minute,
    playerName,
    teamId,
    points,
    timestamp: new Date()
  };

  sheet.incidents.push(incident);

  if (teamId === sheet.homeTeamId) {
    sheet.homeScore += points;
  } else {
    sheet.awayScore += points;
  }

  return sheet;
}

export function recordBasketFoul(
  sheet: MatchSheet,
  playerName: string,
  teamId: number,
  minute: number
): MatchSheet {
  const incident: IncidentBasket = {
    type: 'foul',
    minute,
    playerName,
    teamId,
    points: 0,
    timestamp: new Date()
  };

  sheet.incidents.push(incident);
  return sheet;
}

export function undoLastIncident(sheet: MatchSheet): MatchSheet {
  if (sheet.incidents.length === 0) return sheet;

  const lastIncident = sheet.incidents[sheet.incidents.length - 1];

  // Revert score
  if (lastIncident.type === 'goal' || lastIncident.type === '1pt' || lastIncident.type === '2pt') {
    if (lastIncident.teamId === sheet.homeTeamId) {
      sheet.homeScore -= (lastIncident as any).points || 1;
    } else {
      sheet.awayScore -= (lastIncident as any).points || 1;
    }
  }

  // Remove incident
  sheet.incidents.pop();
  return sheet;
}

export async function generateMatchSheetPDF(
  sheet: MatchSheet,
  homeTeamName: string,
  awayTeamName: string,
  arbitreName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('ACTA DE PARTIT', { align: 'center' });
      doc.fontSize(10).text(`ID: ${sheet.matchId}`, { align: 'center' }).moveDown();

      // Sport icon
      const sportEmoji = sheet.sport === 'futsal' ? '⚽' : sheet.sport === 'basquet' ? '🏀' : '🎾';
      doc.text(`${sportEmoji} ${sheet.sport.toUpperCase()}`, { align: 'center' }).moveDown();

      // Match info
      doc.fontSize(14).font('Helvetica-Bold').text(`${homeTeamName} ${sheet.homeScore} - ${sheet.awayScore} ${awayTeamName}`);
      doc.fontSize(10).font('Helvetica').moveDown();

      doc.text(`Árbitro: ${arbitreName}`);
      doc.text(`Data: ${new Date(sheet.startTime).toLocaleDateString('ca-ES')}`);
      doc.text(`Hora inici: ${new Date(sheet.startTime).toLocaleTimeString('ca-ES')}`);
      if (sheet.endTime) {
        doc.text(`Hora final: ${new Date(sheet.endTime).toLocaleTimeString('ca-ES')}`);
      }
      doc.moveDown();

      // Incidents
      doc.fontSize(12).font('Helvetica-Bold').text('Incidents:');
      doc.fontSize(10).font('Helvetica');

      if (sheet.incidents.length === 0) {
        doc.text('Cap incident registrat');
      } else {
        sheet.incidents.forEach((incident, index) => {
          const teamName = incident.teamId === sheet.homeTeamId ? homeTeamName : awayTeamName;
          const iconMap: any = {
            goal: '⚽',
            yellow_card: '🟨',
            red_card: '🟥',
            '1pt': '1️⃣',
            '2pt': '2️⃣',
            foul: '🚫',
            set_score: '📊'
          };
          
          const icon = iconMap[incident.type] || '';
          doc.text(`${index + 1}. [${incident.minute}'] ${icon} ${incident.playerName} (${teamName}) - ${incident.type}`);
        });
      }

      doc.moveDown();
      doc.fontSize(8).text('Generat per Campo Base', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function getMatchSheetSummary(sheet: MatchSheet): {
  homeScore: number;
  awayScore: number;
  incidents: number;
  goals?: number;
  yellow_cards?: number;
  red_cards?: number;
} {
  const summary: any = {
    homeScore: sheet.homeScore,
    awayScore: sheet.awayScore,
    incidents: sheet.incidents.length
  };

  if (sheet.sport === 'futsal') {
    summary.goals = sheet.incidents.filter(i => i.type === 'goal').length;
    summary.yellow_cards = sheet.incidents.filter(i => i.type === 'yellow_card').length;
    summary.red_cards = sheet.incidents.filter(i => i.type === 'red_card').length;
  }

  return summary;
}
