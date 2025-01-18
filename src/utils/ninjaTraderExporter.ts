import { SignalCombination } from '../types';

export function generateNinjaScriptStrategy(
  combination: SignalCombination,
  strategyName: string,
  tradeDirection: 'Long' | 'Short' | 'Both'
): string {
  const sb: string[] = [];

  // Add basic template structure
  sb.push('using System;');
  sb.push('using System.Collections.Generic;');
  sb.push('using System.Linq;');
  sb.push('using NinjaTrader.Cbi;');
  sb.push('using NinjaTrader.NinjaScript;');
  sb.push('using NinjaTrader.Data;');
  sb.push('using NinjaTrader.Gui.Tools;');
  sb.push('using System.ComponentModel;');
  sb.push('using System.ComponentModel.DataAnnotations;');
  sb.push('using NinjaTrader.NinjaScript.Indicators;');
  sb.push('using NinjaTrader.NinjaScript.Strategies.SignalLibrary;');
  sb.push('');
  sb.push('namespace NinjaTrader.NinjaScript.Strategies');
  sb.push('{');
  sb.push(`    public class ${strategyName} : Strategy`);
  sb.push('    {');

  // Add properties
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name="Profit Target Ticks", Order=1, GroupName="Parameters")]');
  sb.push(`        public int ProfitTargetTicks { get; set; } = ${combination.profitTarget};`);
  sb.push('');
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name="Stop Loss Ticks", Order=2, GroupName="Parameters")]');
  sb.push(`        public int StopLossTicks { get; set; } = ${combination.stopLoss};`);
  sb.push('');
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name="Trailing Stop Ticks", Order=3, GroupName="Parameters")]');
  sb.push(`        public int TrailingStopTicks { get; set; } = ${combination.trailingStop};`);
  sb.push('');
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name="Trade Direction", Order=4, GroupName="Parameters")]');
  sb.push(`        public string TradeDirectionMode { get; set; } = "${tradeDirection}";`);
  sb.push('');
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name = "Entry Mode", GroupName = "Parameters", Order = 1)]');
  sb.push(`        public EntryMode EntryModeProperty { get; set; } = EntryMode.${combination.mode};`);
  sb.push('');
  sb.push('        [NinjaScriptProperty]');
  sb.push('        [Display(Name = "Trade Direction", GroupName = "Parameters", Order = 2)]');
  sb.push(`        public TradeDirection TradeDirectionStrategy { get; set; } = TradeDirection.${tradeDirection};`);
  sb.push('');

  // Add signal lists discovered by GA
  sb.push('        // Signals discovered by Genetic Algorithm');
  sb.push('        private readonly List<string> entry1Signals = new List<string>()');
  sb.push('        {');
  if (combination.entries.entry1 && combination.entries.entry1.length > 0) {
    combination.entries.entry1.forEach(signal => {
      sb.push(`            "${signal.namespace}.${signal.name}",`);
    });
  }
  sb.push('        };');
  sb.push('');

  sb.push('        private List<string> entry2Signals = new List<string>()');
  sb.push('        {');
  if (combination.entries.entry2 && combination.entries.entry2.length > 0) {
    combination.entries.entry2.forEach(signal => {
      sb.push(`            "${signal.namespace}.${signal.name}",`);
    });
  }
  sb.push('        };');
  sb.push('');

  sb.push('        private List<string> entry3Signals = new List<string>()');
  sb.push('        {');
  if (combination.entries.entry3 && combination.entries.entry3.length > 0) {
    combination.entries.entry3.forEach(signal => {
      sb.push(`            "${signal.namespace}.${signal.name}",`);
    });
  }
  sb.push('        };');
  sb.push('');

  // Add enums
  sb.push('        public enum EntryMode');
  sb.push('        {');
  sb.push('            [Display(Name = "Signals (OR Logic)")]');
  sb.push('            Signals,');
  sb.push('            [Display(Name = "Confirmations (AND Logic)")]');
  sb.push('            Confirmations,');
  sb.push('            [Display(Name = "Split Entries")]');
  sb.push('            Split');
  sb.push('        }');
  sb.push('');
  sb.push('        public enum TradeDirection');
  sb.push('        {');
  sb.push('            Long,');
  sb.push('            Short,');
  sb.push('            Both');
  sb.push('        }');
  sb.push('');

  // OnStateChange
  sb.push('        protected override void OnStateChange()');
  sb.push('        {');
  sb.push('            if (State == State.SetDefaults)');
  sb.push('            {');
  sb.push(`                Name = "${strategyName}";`);
  sb.push('                Calculate = Calculate.OnBarClose;');
  sb.push('                EntriesPerDirection = 1;');
  sb.push('                EntryHandling = EntryHandling.AllEntries;');
  sb.push('                IsExitOnSessionCloseStrategy = true;');
  sb.push('                BarsRequiredToTrade = 20;');
  sb.push('            }');
  sb.push('            else if (State == State.Configure)');
  sb.push('            {');
  sb.push('                //Add a new data series');
  sb.push('                AddDataSeries(BarsPeriodType.Day, 1);');
  sb.push('');
  sb.push('                if (ProfitTargetTicks > 0)');
  sb.push('                    SetProfitTarget(CalculationMode.Ticks, ProfitTargetTicks);');
  sb.push('');
  sb.push('                if (StopLossTicks > 0)');
  sb.push('                    SetStopLoss(CalculationMode.Ticks, StopLossTicks);');
  sb.push('');
  sb.push('                // If you want trailing stop, do:');
  sb.push('                // SetTrailStop(CalculationMode.Ticks, TrailingStopTicks);');
  sb.push('            }');
  sb.push('        }');
  sb.push('');

  // OnBarUpdate
  sb.push('        protected override void OnBarUpdate()');
  sb.push('        {');
  sb.push('            if (CurrentBar < BarsRequiredToTrade)');
  sb.push('                return;');
  sb.push('');
  sb.push('            // 1) Evaluate Entry1Signals => direction (+1 or -1) or no signal');
  sb.push('            var (fired1, dir1, keys1) = EvaluateSignals(entry1Signals);');
  sb.push('            // 2) Evaluate Entry2Signals');
  sb.push('            var (fired2, dir2, keys2) = EvaluateSignals(entry2Signals);');
  sb.push('            // 3) Evaluate Entry3Signals');
  sb.push('            var (fired3, dir3, keys3) = EvaluateSignals(entry3Signals);');
  sb.push('');
  sb.push('            // Combine sub-signals based on EntryMode');
  sb.push('            bool finalSignal = false;');
  sb.push('            bool finalLongSignal = false;');
  sb.push('            bool finalShortSignal = false;');
  sb.push('');
  sb.push('            bool useEntry1 = (entry1Signals.Count > 0);');
  sb.push('            bool useEntry2 = (entry2Signals.Count > 0);');
  sb.push('            bool useEntry3 = (entry3Signals.Count > 0);');
  sb.push('');
  sb.push('            switch (EntryModeProperty)');
  sb.push('            {');
  sb.push('                case EntryMode.Signals: // OR logic');
  sb.push('                    finalSignal = (fired1 || fired2 || fired3);');
  sb.push('                    break;');
  sb.push('');
  sb.push('                case EntryMode.Confirmations: // AND logic');
  sb.push('                    // allConfirm starts true; we only AND with the ones that are "active"');
  sb.push('                    bool allConfirm = true;');
  sb.push('                    bool hasAtLeastOneEntry = false;');
  sb.push('');
  sb.push('                    if (useEntry1)');
  sb.push('                    {');
  sb.push('                         hasAtLeastOneEntry = true;');
  sb.push('                         allConfirm &= fired1;  // only AND if entry1 is relevant');
  sb.push('                    }');
  sb.push('                    if (useEntry2)');
  sb.push('                    {');
  sb.push('                        hasAtLeastOneEntry = true;');
  sb.push('                        allConfirm &= fired2;');
  sb.push('                    }');
  sb.push('                    if (useEntry3)');
  sb.push('                    {');
  sb.push('                        hasAtLeastOneEntry = true;');
  sb.push('                        allConfirm &= fired3;');
  sb.push('                    }');
  sb.push('');
  sb.push('                    finalSignal = (hasAtLeastOneEntry && allConfirm);');
  sb.push('                    break;');
  sb.push('');
  sb.push('                case EntryMode.Split:');
  sb.push('                    // minimal approach: Entry1 => finalLongSignal, Entry2 => finalShortSignal, etc.');
  sb.push('                    finalLongSignal  = fired1 && (dir1 == +1);');
  sb.push('                    finalShortSignal = fired2 && (dir2 == -1);');
  sb.push('                    // optionally use entry3 for something else');
  sb.push('                    break;');
  sb.push('');
  sb.push('                default:');
  sb.push('                    finalSignal = (fired1 || fired2 || fired3);');
  sb.push('                    break;');
  sb.push('            }');
  sb.push('');
  sb.push('            // 2) Now place trades considering TradeDirectionMode');
  sb.push('            //    - Long => only do EnterLong');
  sb.push('            //    - Short => only do EnterShort');
  sb.push('            //    - Both => do both');
  sb.push('');
  sb.push('           if (TradeDirectionStrategy == TradeDirection.Long) { TradeDirectionMode = "Long"; }');
  sb.push('           if (TradeDirectionStrategy == TradeDirection.Short) { TradeDirectionMode = "Short"; }');
  sb.push('           if (TradeDirectionStrategy == TradeDirection.Both) { TradeDirectionMode = "Both"; }');
  sb.push('');
  sb.push('            //if (EntryModeProperty == EntryMode.Split)');
  sb.push('            bool trade = true;');
  sb.push('            if (trade)');
  sb.push('            {');
  sb.push('                if (TradeDirectionMode == "Long" || TradeDirectionMode == "Both")');
  sb.push('                {');
  sb.push('                    if (finalLongSignal && Position.MarketPosition == MarketPosition.Flat)');
  sb.push('                    {');
  sb.push('                        EnterLong("SplitLong");');
  sb.push('                    }');
  sb.push('                }');
  sb.push('                if (TradeDirectionMode == "Short" || TradeDirectionMode == "Both")');
  sb.push('                {');
  sb.push('                    if (finalShortSignal && Position.MarketPosition == MarketPosition.Flat)');
  sb.push('                    {');
  sb.push('                        EnterShort("SplitShort");');
  sb.push('                    }');
  sb.push('                }');
  sb.push('            }');
  sb.push('            else');
  sb.push('            {');
  sb.push('                if (finalSignal && Position.MarketPosition == MarketPosition.Flat)');
  sb.push('                {');
  sb.push('                    // Evaluate overall direction of these sub-signals if you want more nuance.');
  sb.push('                    // For demonstration, we will do a simple approach:');
  sb.push('');
  sb.push('                    int sumDir = 0;');
  sb.push('                    if (fired1) sumDir += dir1;');
  sb.push('                    if (fired2) sumDir += dir2;');
  sb.push('                    if (fired3) sumDir += dir3;');
  sb.push('                    // if sumDir > 0 => more bullish than bearish, if sumDir < 0 => more bearish');
  sb.push('');
  sb.push('                    if ((TradeDirectionMode == "Long" || TradeDirectionMode == "Both") && sumDir >= 0)');
  sb.push('                    {');
  sb.push('                        EnterLong("MyEntryLong");');
  sb.push('                    }');
  sb.push('                    else if ((TradeDirectionMode == "Short" || TradeDirectionMode == "Both") && sumDir < 0)');
  sb.push('                    {');
  sb.push('                        EnterShort("MyEntryShort");');
  sb.push('                    }');
  sb.push('                }');
  sb.push('            }');
  sb.push('        }');
  sb.push('');

  // EvaluateSignals method
  sb.push('        /// <summary>');
  sb.push('        /// Evaluate a list of signal keys from SignalLibrary. Returns (fired, direction, keys).');
  sb.push('        /// direction = +1 => bullish, -1 => bearish, 0 => conflict or none');
  sb.push('        /// fired = direction != 0');
  sb.push('        /// </summary>');
  sb.push('        private (bool fired, int direction, List<string> firedKeys) EvaluateSignals(List<string> signalKeys)');
  sb.push('        {');
  sb.push('            if (signalKeys == null || signalKeys.Count == 0)');
  sb.push('                return (false, 0, new List<string>());');
  sb.push('');
  sb.push('            bool foundBullish = false;');
  sb.push('            bool foundBearish = false;');
  sb.push('            var firedList = new List<string>();');
  sb.push('');
  sb.push('            foreach (var sigKey in signalKeys)');
  sb.push('            {');
  sb.push('                // Split namespace and signal name');
  sb.push('                var parts = sigKey.Split(".");');
  sb.push('                if (parts.Length != 2) continue;');
  sb.push('');
  sb.push('                var namespace = parts[0];');
  sb.push('                var signalName = parts[1];');
  sb.push('');
  sb.push('                // Get the signal instance from the appropriate namespace');
  sb.push('                var signal = SignalLibrary.GetSignal(namespace, signalName);');
  sb.push('                if (signal == null) continue;');
  sb.push('');
  sb.push('                var result = signal.Evaluate(this);');
  sb.push('                if (result.SignalFound)');
  sb.push('                {');
  sb.push('                    firedList.Add(sigKey);');
  sb.push('                    if (result.Direction == +1) foundBullish = true;');
  sb.push('                    else if (result.Direction == -1) foundBearish = true;');
  sb.push('                }');
  sb.push('            }');
  sb.push('');
  sb.push('            int dir = 0;');
  sb.push('            if (foundBullish && !foundBearish) dir = +1;');
  sb.push('            else if (foundBearish && !foundBullish) dir = -1;');
  sb.push('            else dir = 0;');
  sb.push('            bool fired = (dir != 0);');
  sb.push('            return (fired, dir, firedList);');
  sb.push('        }');
  sb.push('    }');
  sb.push('}');

  return sb.join('\n');
}