'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import AddGoalForm from './AddGoalForm';
import GoalCard from './GoalCard';
import type { Goal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

export default function GoalsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const goals = useLiveQuery(
    () => db.goals.orderBy('targetDate').toArray(),
    []
  );

  const parsedGoals: Goal[] = (goals || []).map(g => ({
    ...g,
    targetDate: new Date(g.targetDate),
  }));

  const handleAddGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      await db.goals.add({
        ...goal,
        targetDate: goal.targetDate.toISOString(),
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleUpdateGoal = async (id: number, newCurrentAmount: number) => {
    try {
      await db.goals.update(id, { currentAmount: newCurrentAmount });
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await db.goals.delete(id);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  return (
    <div className="space-y-6">
       <div className="text-right">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Tambah Tujuan Baru
            </Button>
          </DialogTrigger>
          <AddGoalForm onAddGoal={handleAddGoal} />
        </Dialog>
      </div>
      
      {goals === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : parsedGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {parsedGoals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              goal={goal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold text-muted-foreground">Belum Ada Tujuan</h3>
          <p className="text-muted-foreground mt-2">Mulai buat tujuan keuangan pertamamu!</p>
        </div>
      )}
    </div>
  );
}
