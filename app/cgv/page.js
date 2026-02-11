import Link from 'next/link';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-accent text-sm mb-8 hover:underline">← Retour</Link>

        <h1 className="font-display text-3xl font-bold mb-2">Conditions Generales de Vente</h1>
        <p className="text-txt-3 text-sm mb-10">Derniere mise a jour : 11 fevrier 2026</p>

        <div className="space-y-8 text-txt-2 text-[0.92rem] leading-relaxed">

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 1 - Objet</h2>
            <p>Les presentes conditions generales de vente (CGV) regissent les relations contractuelles entre TradeScope, service edite par Jordan Fitoussi, entrepreneur individuel, et tout utilisateur souscrivant a un abonnement payant sur la plateforme TradeScope accessible a l adresse tradescopev2.vercel.app (ci-apres le &quot;Service&quot;).</p>
            <p className="mt-2">TradeScope est un journal de trading en ligne permettant aux utilisateurs de suivre, analyser et ameliorer leurs performances de trading.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 2 - Editeur du Service</h2>
            <p>Le Service est edite par :</p>
            <div className="bg-bg-card border border-brd rounded-xl p-4 mt-2 text-sm">
              <p><strong className="text-txt-1">Jordan Fitoussi</strong></p>
              <p>Entrepreneur individuel</p>
              <p>Email : fitoussi.jordan@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 3 - Services et Tarifs</h2>
            <p>TradeScope propose trois formules d abonnement mensuel :</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
                <div className="font-bold text-txt-1">Starter</div>
                <div className="text-xl font-bold text-accent">4,99 EUR/mois</div>
                <div className="text-xs text-txt-3 mt-1">1 compte de trading</div>
              </div>
              <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
                <div className="font-bold text-txt-1">Pro</div>
                <div className="text-xl font-bold text-accent">9,99 EUR/mois</div>
                <div className="text-xs text-txt-3 mt-1">3 comptes de trading</div>
              </div>
              <div className="bg-bg-card border border-brd rounded-xl p-4 text-center">
                <div className="font-bold text-txt-1">Unlimited</div>
                <div className="text-xl font-bold text-accent">19,99 EUR/mois</div>
                <div className="text-xs text-txt-3 mt-1">Comptes illimites</div>
              </div>
            </div>
            <p className="mt-3">Les prix sont indiques en euros, toutes taxes comprises (TTC). TradeScope se reserve le droit de modifier ses tarifs a tout moment. Les modifications de prix ne s appliqueront pas aux abonnements en cours.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 4 - Essai gratuit</h2>
            <p>Chaque nouvel utilisateur beneficie d un essai gratuit de 7 jours sur la formule de son choix. A l issue de cette periode, l abonnement sera automatiquement active et le moyen de paiement fourni sera debite, sauf annulation prealable par l utilisateur.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 5 - Inscription et Paiement</h2>
            <p>L inscription au Service necessite la creation d un compte avec une adresse email valide et un mot de passe. Le paiement est gere par Stripe, prestataire de paiement securise. TradeScope ne stocke aucune donnee bancaire.</p>
            <p className="mt-2">L abonnement est a tacite reconduction mensuelle. Le prelevement est effectue automatiquement chaque mois a la date anniversaire de la souscription.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 6 - Droit de retractation</h2>
            <p>Conformement a l article L221-28 du Code de la consommation, le droit de retractation ne peut etre exerce pour les contrats de fourniture d un contenu numerique non fourni sur un support materiel dont l execution a commence avec l accord du consommateur.</p>
            <p className="mt-2">Toutefois, l essai gratuit de 7 jours permet a l utilisateur de tester le Service sans engagement financier.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 7 - Resiliation</h2>
            <p>L utilisateur peut resilier son abonnement a tout moment depuis son espace &quot;Mon Compte&quot; ou via le portail de gestion Stripe. La resiliation prend effet a la fin de la periode de facturation en cours. L utilisateur conserve l acces au Service jusqu a cette date.</p>
            <p className="mt-2">Aucun remboursement au prorata ne sera effectue pour la periode restante apres resiliation.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 8 - Responsabilite</h2>
            <p>TradeScope est un outil d analyse et de suivi. Il ne constitue en aucun cas un conseil en investissement ou une incitation a trader. L utilisateur est seul responsable de ses decisions de trading.</p>
            <p className="mt-2">TradeScope s efforce d assurer la disponibilite et le bon fonctionnement du Service mais ne garantit pas une disponibilite ininterrompue. TradeScope ne pourra etre tenu responsable des pertes de donnees ou de tout prejudice indirect lie a l utilisation du Service.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 9 - Donnees personnelles</h2>
            <p>Les donnees personnelles collectees (email, nom) sont necessaires au fonctionnement du Service. Elles sont stockees de maniere securisee via Supabase et ne sont jamais vendues ou transmises a des tiers, sauf obligation legale.</p>
            <p className="mt-2">Conformement au RGPD, l utilisateur dispose d un droit d acces, de rectification et de suppression de ses donnees. Pour exercer ces droits, contacter : fitoussi.jordan@gmail.com</p>
            <p className="mt-2">Les donnees de trading saisies par l utilisateur lui appartiennent. En cas de suppression du compte, l ensemble des donnees sera efface dans un delai de 30 jours.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 10 - Propriete intellectuelle</h2>
            <p>L ensemble des elements constituant le Service (design, code, textes, logos) est la propriete exclusive de TradeScope. Toute reproduction, distribution ou utilisation non autorisee est strictement interdite.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 11 - Modification des CGV</h2>
            <p>TradeScope se reserve le droit de modifier les presentes CGV a tout moment. Les utilisateurs seront informes par email de toute modification substantielle. La poursuite de l utilisation du Service apres notification vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 12 - Droit applicable et litiges</h2>
            <p>Les presentes CGV sont soumises au droit francais. En cas de litige, les parties s engagent a rechercher une solution amiable prealablement a toute action judiciaire. A defaut, les tribunaux competents seront ceux du ressort du domicile du defendeur.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg text-txt-1 mb-3">Article 13 - Contact</h2>
            <p>Pour toute question relative aux presentes CGV ou au Service, l utilisateur peut contacter TradeScope a l adresse : fitoussi.jordan@gmail.com</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-brd text-center text-txt-3 text-xs">
          &copy; 2026 TradeScope. Tous droits reserves.
        </div>
      </div>
    </div>
  );
}
