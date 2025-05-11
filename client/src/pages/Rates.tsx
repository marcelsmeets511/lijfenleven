import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, Plus } from "lucide-react";

// Rate schema (form validation)
const rateSchema = z.object({
  code: z.string().min(1, "Code is verplicht"),
  description: z.string().min(2, "Beschrijving moet minimaal 2 karakters bevatten"),
  amount: z.coerce.number().min(0, "Bedrag moet 0 of hoger zijn"),
  period: z.string(),
  vatRate: z.coerce.number().min(0, "BTW percentage moet 0 of hoger zijn"),
  defaultQuantity: z.coerce.number().int().min(1, "Standaard aantal moet minimaal 1 zijn").default(1),
});

type RateFormValues = z.infer<typeof rateSchema>;

// Rate type
interface Rate {
  id: number;
  code: string;
  description: string;
  amount: number;
  period: string;
  vatRate: number;
  defaultQuantity: number;
  createdAt: string;
}

const Rates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editRate, setEditRate] = useState<Rate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  // Query to fetch rates
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["/api/rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/rates");
      const data = await response.json();
      return data || [];
    },
  });

  // Form for creating/editing rates
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      code: "",
      description: "",
      amount: 0,
      period: "per sessie",
      vatRate: 21,
      defaultQuantity: 1,
    },
  });

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      code: "",
      description: "",
      amount: 0,
      period: "per sessie",
      vatRate: 21,
      defaultQuantity: 1,
    });
    setEditRate(null);
  };

  // Set form values when editing
  const setFormValues = (rate: Rate) => {
    form.reset({
      code: rate.code,
      description: rate.description,
      amount: rate.amount,
      period: rate.period,
      vatRate: rate.vatRate,
      defaultQuantity: rate.defaultQuantity,
    });
    setEditRate(rate);
  };

  // Mutation for creating rates
  const createRateMutation = useMutation({
    mutationFn: async (data: RateFormValues) => {
      const response = await apiRequest("POST", "/api/rates", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      toast({
        title: "Tarief aangemaakt",
        description: "Het tarief is succesvol aangemaakt",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken tarief",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating rates
  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RateFormValues }) => {
      const response = await apiRequest("PUT", `/api/rates/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      toast({
        title: "Tarief bijgewerkt",
        description: "Het tarief is succesvol bijgewerkt",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken tarief",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting rates
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/rates/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      toast({
        title: "Tarief verwijderd",
        description: "Het tarief is succesvol verwijderd",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRateId(null);
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen tarief",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating/editing rates
  const onSubmit = (data: RateFormValues) => {
    if (editRate) {
      updateRateMutation.mutate({ id: editRate.id, data });
    } else {
      createRateMutation.mutate(data);
    }
  };

  // Confirm deletion of a rate
  const confirmDelete = () => {
    if (selectedRateId !== null) {
      deleteRateMutation.mutate(selectedRateId);
    }
  };

  // Format currency 
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tarievenbeheer</h1>
          <p className="text-gray-500">Beheer uw tarieven voor diensten</p>
        </div>
        <Button 
          onClick={() => { 
            resetForm(); 
            setIsCreateDialogOpen(true); 
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nieuw tarief
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarieven</CardTitle>
          <CardDescription>
            Overzicht van alle tarieven
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Laden...</div>
          ) : (
            <Table>
              <TableCaption>Lijst van geregistreerde tarieven</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>BTW %</TableHead>
                  <TableHead>Standaard aantal</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Geen tarieven gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate: any) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.code}</TableCell>
                      <TableCell>{rate.description}</TableCell>
                      <TableCell>{formatCurrency(rate.amount)}</TableCell>
                      <TableCell>{rate.period}</TableCell>
                      <TableCell>{rate.vatRate}%</TableCell>
                      <TableCell>{rate.defaultQuantity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormValues(rate);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRateId(rate.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Rate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuw tarief toevoegen</DialogTitle>
            <DialogDescription>
              Vul de tariefgegevens in om een nieuw tarief aan te maken.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="CONSULT" {...field} />
                    </FormControl>
                    <FormDescription>Een korte code voor het tarief (bijv. CONSULT, MASSAGE)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Consult 60 minuten" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een periode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per sessie">Per sessie</SelectItem>
                        <SelectItem value="per uur">Per uur</SelectItem>
                        <SelectItem value="per dag">Per dag</SelectItem>
                        <SelectItem value="per behandeling">Per behandeling</SelectItem>
                        <SelectItem value="per traject">Per traject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BTW percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standaard aantal</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormDescription>Het standaard aantal dat wordt ingevuld bij het maken van een factuur item</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(false);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  disabled={createRateMutation.isPending}
                >
                  {createRateMutation.isPending ? "Bezig..." : "Opslaan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tarief bewerken</DialogTitle>
            <DialogDescription>
              Werk de tariefgegevens bij.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="CONSULT" {...field} />
                    </FormControl>
                    <FormDescription>Een korte code voor het tarief (bijv. CONSULT, MASSAGE)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Consult 60 minuten" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrag (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een periode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per sessie">Per sessie</SelectItem>
                        <SelectItem value="per uur">Per uur</SelectItem>
                        <SelectItem value="per dag">Per dag</SelectItem>
                        <SelectItem value="per behandeling">Per behandeling</SelectItem>
                        <SelectItem value="per traject">Per traject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BTW percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standaard aantal</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormDescription>Het standaard aantal dat wordt ingevuld bij het maken van een factuur item</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    resetForm();
                    setIsEditDialogOpen(false);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  disabled={updateRateMutation.isPending}
                >
                  {updateRateMutation.isPending ? "Bezig..." : "Bijwerken"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Rate Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tarief verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u dit tarief wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteRateMutation.isPending}
            >
              {deleteRateMutation.isPending ? "Bezig..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rates;