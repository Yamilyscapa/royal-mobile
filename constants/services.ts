export interface ServiceInterface {
	name: string;
	price: number;
	description: string;
	duration: number;
}

export const haircuts = [
	{
		name: 'Corte Prince (Junior)',
		price: 180,
		description: 'Lavado de cabello, corte de cabello, lavado de cabello final (opcional), peinado y perfume.',
		duration: 30
	},
	{
		name: 'Corte Royal',
		price: 200,
		description: 'Lavado de cabello, corte de cabello, lavado de cabello al finalizar (opcional), peinado y perfume.',
		duration: 30
	},
	{
		name: 'Corte Imperial',
		price: 280,
		description: 'Lavado de cabello, exfoliación, vapor caliente y masaje con guante, mascarilla puntos negros, corte de cabello, crema humectante para ojeras, lavado de cabello al finalizar (opcional), peinado y perfume.',
		duration: 30
	},
	{
		name: 'Limpieza Facial',
		price: 200,
		description: 'Limpieza de rostro, exfoliación, vapor caliente y masaje con guante, mascarilla puntos negros, mascarilla para ojeras, vapor frío y mascarilla humectante, crema hidratante.',
		duration: 30
	},
	{
		name: 'Barba King',
		price: 170,
		description: 'Perfilación y corte de barba, limpieza de rostro, aceite pre-shave, aceite de afeitado y exfoliación, vapor caliente y masaje con guante, delineado y afeitado, vapor frío y crema humectante, after shave y perfume.',
		duration: 30
	},
	{
		name: 'Corte y Barba Royal',
		price: 300,
		description: 'Lavado de cabello, corte de cabello, perfilación y corte de barba, delineado y afeitado, lavado de cabello al finalizar (opcional), after shave, peinado y perfume.',
		duration: 30
	},
	{
		name: 'Corte y Barba Imperial',
		price: 380,
		description: 'Lavado de cabello, corte de cabello, perfilación y corte de barba, limpieza de rostro, exfoliación, vapor caliente y masaje con guante, mascarilla puntos negros, vapor frío y mascarilla para ojeras, lavado de cabello al finalizar (opcional), after shave, peinado y perfume.',
		duration: 30
	},
] as ServiceInterface[];

export const spa = [
	{
		name: 'Manicure',
		price: 150,
		description: 'Limpieza de manos y uñas en seco, esmaltado transparente.',
		duration: 30
	},
	{
		name: 'Pedicure',
		price: 200,
		description: 'Limpieza de pies y uñas, esmaltado transparente.',
		duration: 30
	},
	{
		name: 'Manicure Spa',
		price: 200,
		description: 'Tina con sales minerales, limpieza de manos y uñas, exfoliación, mascarilla con aceites esenciales y relajantes, gel semipermanente transparente.',
		duration: 30
	},
	{
		name: 'Pedicure Spa',
		price: 350,
		description: 'Tina con sales minerales, limpieza profunda de pies y uñas, exfoliación, mascarilla con aceites esenciales y relajantes, masaje relajante, gel semipermanente transparente.',
		duration: 30
	},
	{
		name: 'Combo del Rey',
		price: 510,
		description: 'Incluye Manicure y Pedicure Spa.',
		duration: 30
	},
] as ServiceInterface[];
